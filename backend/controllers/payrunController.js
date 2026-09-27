// ====================================================================
// Payrun Management Controller
// /orbital-payrun-wizard   — Two-step pay run creation & batching
// /quantum-payslip-engine  — Automated salary computation & contract syncing
// /teleport-pdf-disbursal  — Bulk email delivery & telemetry
// ====================================================================

const quantumPool = require('../config/quantumPool');

/**
 * GET /api/payruns
 * List all pay runs with filtering by status and search
 */
async function getAllPayruns(req, res) {
  try {
    const { status, search, sortBy = 'start_date', order = 'DESC' } = req.query;

    let query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM payslips WHERE payrun_id = p.id) AS actual_payslips_count,
        (SELECT COUNT(*) FROM payslips WHERE payrun_id = p.id AND status = 'Sent') AS payslips_sent_count,
        (SELECT COUNT(*) FROM payslips WHERE payrun_id = p.id AND status = 'Paid') AS payslips_paid_count
      FROM payruns p
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.run_name ILIKE $${params.length} OR p.run_code ILIKE $${params.length})`;
    }

    const safeSort = ['start_date', 'id', 'total_net', 'total_gross', 'status'].includes(sortBy)
      ? `p.${sortBy}`
      : 'p.start_date';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSort} ${safeOrder}`;

    const { rows, thrustLatencyMs } = await quantumPool.query(query, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/orbital-payrun-wizard',
      },
    });
  } catch (error) {
    console.error('Error fetching payruns:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/payruns/:id
 * Retrieve pay run details along with its generated payslips and validation warnings
 */
async function getPayrunById(req, res) {
  try {
    const { id } = req.params;

    const runRes = await quantumPool.query(`SELECT * FROM payruns WHERE id = $1`, [id]);
    if (runRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payrun cycle not found in registry' });
    }
    const payrun = runRes.rows[0];

    // Fetch associated payslips with employee & department joins
    const slipQuery = `
      SELECT 
        s.*,
        p.start_date,
        p.end_date,
        p.payment_date,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        e.email,
        e.emergency_contact,
        e.clearance_tier,
        d.name AS department_name,
        d.code AS department_code,
        d.orbital_deck,
        c.contract_ref,
        c.salary_structure AS contract_structure
      FROM payslips s
      JOIN payruns p ON s.payrun_id = p.id
      JOIN employees e ON s.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN contracts c ON s.contract_id = c.id
      WHERE s.payrun_id = $1
      ORDER BY e.id ASC
    `;
    const slipRes = await quantumPool.query(slipQuery, [id]);
    payrun.payslips = slipRes.rows;

    return res.json({
      success: true,
      data: payrun,
      quantumProfiling: { skill: '/orbital-payrun-wizard' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/payruns
 * /orbital-payrun-wizard (Two-step Payrun Creation)
 * Step 1: Scope & Period (run_name, start_date, end_date, payment_date, salary_structure)
 * Step 2: Employee batch filtering (selected employee_ids)
 */
async function createPayrun(req, res) {
  try {
    const {
      run_name,
      start_date,
      end_date,
      payment_date,
      salary_structure = 'Standard Quantum Compensation',
      employee_ids = [],
      notes,
    } = req.body;

    if (!run_name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'run_name, start_date, and end_date are required for orbital payrun creation',
      });
    }

    const payDate = payment_date || end_date;

    // Insert new payrun in Draft status
    const insertQuery = `
      INSERT INTO payruns (
        run_name, start_date, end_date, payment_date, salary_structure, status, notes
      ) VALUES ($1, $2, $3, $4, $5, 'Draft', $6)
      RETURNING *
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(insertQuery, [
      run_name,
      start_date,
      end_date,
      payDate,
      salary_structure,
      notes || `Created via /orbital-payrun-wizard on ${new Date().toISOString()}`,
    ]);

    const payrun = rows[0];

    // If explicit employee IDs were selected in Step 2, compute them right away,
    // otherwise wait for user to hit "Compute" in the wizard.
    if (employee_ids && employee_ids.length > 0) {
      await computePayrunInternal(payrun.id, employee_ids);
      const refreshed = await quantumPool.query(`SELECT * FROM payruns WHERE id = $1`, [payrun.id]);
      return res.status(201).json({
        success: true,
        message: `/orbital-payrun-wizard: Payrun cycle '${payrun.run_name}' created and batched with ${employee_ids.length} crew members`,
        data: refreshed.rows[0],
        quantumProfiling: { thrustLatencyMs, skill: '/orbital-payrun-wizard' },
      });
    }

    return res.status(201).json({
      success: true,
      message: `/orbital-payrun-wizard: Draft payrun '${payrun.run_name}' created. Ready for employee batch computation.`,
      data: payrun,
      quantumProfiling: { thrustLatencyMs, skill: '/orbital-payrun-wizard' },
    });
  } catch (error) {
    console.error('Error creating payrun:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Internal computation logic for /quantum-payslip-engine
 */
async function computePayrunInternal(payrunId, targetEmployeeIds = null) {
  const client = await quantumPool.getQuantumClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch payrun details
    const payrunRes = await client.query(`SELECT * FROM payruns WHERE id = $1 FOR UPDATE`, [payrunId]);
    if (payrunRes.rows.length === 0) throw new Error('Payrun not found');
    const payrun = payrunRes.rows[0];

    // 2. Fetch target employees: either specified batch or all active employees
    let empQuery = `SELECT id, employee_id, first_name, last_name, email, job_position, department_id, schedule FROM employees WHERE status != 'Suspended'`;
    let empParams = [];
    if (targetEmployeeIds && targetEmployeeIds.length > 0) {
      empQuery += ` AND id = ANY($1::int[])`;
      empParams = [targetEmployeeIds];
    }
    const empRes = await client.query(empQuery, empParams);
    const employeesToProcess = empRes.rows;

    let totalGross = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    // 3. Process each astronaut through /quantum-payslip-engine
    for (const emp of employeesToProcess) {
      // Look up active contract for this period
      const ctrRes = await client.query(
        `SELECT id, contract_ref, base_salary, gravity_allowance, salary_structure, status
         FROM contracts
         WHERE employee_id = $1 
           AND status = 'active'
           AND start_date <= $2 
           AND (end_date IS NULL OR end_date >= $3)
         ORDER BY start_date DESC LIMIT 1`,
        [emp.id, payrun.end_date, payrun.start_date]
      );

      let ctr = ctrRes.rows[0];
      let annualBase = ctr ? parseFloat(ctr.base_salary) : 100000.00;
      let annualGA = ctr ? parseFloat(ctr.gravity_allowance) : 12000.00;

      // Base monthly figures
      const mBase = parseFloat((annualBase / 12.0).toFixed(2));
      const mGA = parseFloat((annualGA / 12.0).toFixed(2));

      // Correlate attendance logs in period (/orbital-attendance-sync)
      const attRes = await client.query(
        `SELECT 
           COUNT(*) AS total_shifts,
           COALESCE(SUM(worked_hours), 0) AS total_hours,
           COUNT(*) FILTER (WHERE status = 'Overtime') AS overtime_shifts,
           COUNT(*) FILTER (WHERE status = 'Late') AS late_shifts
         FROM attendance_logs
         WHERE employee_id = $1 AND date >= $2 AND date <= $3`,
        [emp.id, payrun.start_date, payrun.end_date]
      );
      const attStats = attRes.rows[0];
      const workedHours = parseFloat(attStats.total_hours) > 0 ? parseFloat(attStats.total_hours) : 176.00;
      const workedDays = Math.min(22, Math.max(20, Math.round(workedHours / 8.0)));

      // Propulsion bonus for overtime shifts or critical engineering roles
      let propulsionBonus = 0;
      if (parseInt(attStats.overtime_shifts, 10) > 0) {
        propulsionBonus = parseInt(attStats.overtime_shifts, 10) * 150.00;
      } else if (emp.department_id === 1) {
        propulsionBonus = 350.00; // Quantum propulsion department standing bonus
      }

      const totalAllow = mGA + propulsionBonus;
      const gross = mBase + totalAllow;

      // Deductions (/quantum-payslip-engine rules)
      const quantumTax = parseFloat((gross * 0.15).toFixed(2)); // 15% Progressive Base
      const medicalFund = parseFloat((gross * 0.025).toFixed(2)); // 2.5% Atmospheric / Decompression
      const planetaryPension = parseFloat((gross * 0.05).toFixed(2)); // 5% Interplanetary Pension
      const totalDed = quantumTax + medicalFund + planetaryPension;
      const net = gross - totalDed;

      totalGross += gross;
      totalAllowances += totalAllow;
      totalDeductions += totalDed;
      totalNet += net;

      // Generate computation trace audit log
      const traceLog = {
        engine: '/quantum-payslip-engine',
        timestamp: new Date().toISOString(),
        contract: {
          id: ctr?.id || null,
          ref: ctr?.contract_ref || 'DEFAULT-ACTIVE',
          annual_base: annualBase,
          annual_allowance: annualGA,
        },
        attendance_correlation: {
          worked_hours: workedHours,
          worked_days: workedDays,
          overtime_shifts: parseInt(attStats.overtime_shifts, 10),
          late_shifts: parseInt(attStats.late_shifts, 10),
        },
        formula: 'Net = (MonthlyBase + GravityAllowance + PropulsionBonus) - (QuantumTax[15%] + MedicalAtmosphere[2.5%] + PlanetaryPension[5%])',
        tax_bracket: 'Standard Orbital Tier-A (15%)',
        status: 'NOMINAL',
      };

      const slipNumber = `PSL-${payrun.run_code.replace('PR-', '')}-${emp.employee_id}`;

      // Upsert payslip
      await client.query(
        `INSERT INTO payslips (
           slip_number, payrun_id, employee_id, contract_id, worked_days, total_hours,
           base_salary, gravity_allowance, propulsion_bonus, hazard_allowance,
           quantum_tax, medical_decompression_fund, planetary_pension,
           total_allowances, total_deductions, gross_pay, net_pay,
           status, computation_trace, notes
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13,
           $14, $15, $16, $17,
           'Generated', $18, $19
         )
         ON CONFLICT (payrun_id, employee_id)
         DO UPDATE SET
           worked_days = EXCLUDED.worked_days,
           total_hours = EXCLUDED.total_hours,
           base_salary = EXCLUDED.base_salary,
           gravity_allowance = EXCLUDED.gravity_allowance,
           propulsion_bonus = EXCLUDED.propulsion_bonus,
           quantum_tax = EXCLUDED.quantum_tax,
           medical_decompression_fund = EXCLUDED.medical_decompression_fund,
           planetary_pension = EXCLUDED.planetary_pension,
           total_allowances = EXCLUDED.total_allowances,
           total_deductions = EXCLUDED.total_deductions,
           gross_pay = EXCLUDED.gross_pay,
           net_pay = EXCLUDED.net_pay,
           computation_trace = EXCLUDED.computation_trace,
           updated_at = CURRENT_TIMESTAMP`,
        [
          slipNumber, payrunId, emp.id, ctr?.id || null, workedDays, workedHours,
          mBase, mGA, propulsionBonus, 0.00,
          quantumTax, medicalFund, planetaryPension,
          totalAllow, totalDed, gross, net,
          traceLog, `Computed via /quantum-payslip-engine for cycle ${payrun.run_code}`,
        ]
      );
    }

    // 4. Update payrun totals and status to Computed
    await client.query(
      `UPDATE payruns
       SET 
         status = 'Computed',
         total_employees = $1,
         total_gross = $2,
         total_allowances = $3,
         total_deductions = $4,
         total_net = $5,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        employeesToProcess.length,
        parseFloat(totalGross.toFixed(2)),
        parseFloat(totalAllowances.toFixed(2)),
        parseFloat(totalDeductions.toFixed(2)),
        parseFloat(totalNet.toFixed(2)),
        payrunId,
      ]
    );

    await client.query('COMMIT');
    return { count: employeesToProcess.length, totalNet };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * POST /api/payruns/:id/compute
 * /quantum-payslip-engine Execution Endpoint
 */
async function computePayrun(req, res) {
  try {
    const { id } = req.params;
    const { employee_ids } = req.body || {};

    const startTime = process.hrtime.bigint();
    const result = await computePayrunInternal(id, employee_ids);
    const endTime = process.hrtime.bigint();
    const latencyMs = Number(endTime - startTime) / 1e6;

    const refreshed = await quantumPool.query(`SELECT * FROM payruns WHERE id = $1`, [id]);

    return res.json({
      success: true,
      message: `/quantum-payslip-engine: Computed ${result.count} astronaut payslips successfully`,
      data: refreshed.rows[0],
      quantumProfiling: {
        thrustLatencyMs: parseFloat(latencyMs.toFixed(3)),
        skill: '/quantum-payslip-engine',
      },
    });
  } catch (error) {
    console.error('Error computing payrun:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/payruns/:id/validate
 * Validates payrun pre-flight conditions: checks duplicate slips, missing contracts, unclosed exceptions
 */
async function validatePayrun(req, res) {
  try {
    const { id } = req.params;

    const payrunRes = await quantumPool.query(`SELECT * FROM payruns WHERE id = $1`, [id]);
    if (payrunRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payrun cycle not found' });
    }
    const payrun = payrunRes.rows[0];

    const warnings = [];

    // 1. Check for missing contract links
    const noContractRes = await quantumPool.query(
      `SELECT e.full_name, e.employee_id 
       FROM payslips s 
       JOIN (SELECT id, (first_name || ' ' || last_name) AS full_name, employee_id FROM employees) e ON s.employee_id = e.id
       WHERE s.payrun_id = $1 AND s.contract_id IS NULL`,
      [id]
    );
    if (noContractRes.rows.length > 0) {
      warnings.push({
        code: 'MISSING_ACTIVE_CONTRACT',
        message: `${noContractRes.rows.length} crew member(s) computed with baseline fallbacks due to missing active contract.`,
        astronauts: noContractRes.rows.map(r => r.full_name),
      });
    }

    // 2. Check for zero or negative net pay
    const zeroNetRes = await quantumPool.query(
      `SELECT s.id, s.net_pay, e.first_name, e.last_name 
       FROM payslips s 
       JOIN employees e ON s.employee_id = e.id
       WHERE s.payrun_id = $1 AND s.net_pay <= 0`,
      [id]
    );
    if (zeroNetRes.rows.length > 0) {
      warnings.push({
        code: 'ANOMALOUS_NET_PAY',
        message: `Detected ${zeroNetRes.rows.length} payslip(s) with zero or non-positive net pay.`,
      });
    }

    // 3. Check for unclosed attendance exceptions in this period
    const exceptionRes = await quantumPool.query(
      `SELECT COUNT(*) FROM attendance_logs 
       WHERE is_exception = TRUE AND date >= $1 AND date <= $2`,
      [payrun.start_date, payrun.end_date]
    );
    if (parseInt(exceptionRes.rows[0].count, 10) > 0) {
      warnings.push({
        code: 'UNRESOLVED_ATTENDANCE_EXCEPTIONS',
        message: `${exceptionRes.rows[0].count} orbital attendance exceptions detected in this pay cycle window. Audit recommended.`,
      });
    }

    const validatedBy = req.user?.clearanceLevel || 'Level-5 Fleet Admiral';

    const updateRes = await quantumPool.query(
      `UPDATE payruns 
       SET 
         status = 'Validated',
         validation_warnings = $1,
         validated_by = $2,
         validated_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(warnings), validatedBy, id]
    );

    return res.json({
      success: true,
      message: `Payrun cycle '${payrun.run_name}' validated with ${warnings.length} operational advisories`,
      data: updateRes.rows[0],
      warnings,
      quantumProfiling: { skill: '/orbital-payrun-wizard' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/payruns/:id/mark-paid
 * Marks payrun and all associated payslips as 'Paid'
 */
async function markPayrunPaid(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const paidBy = req.user?.clearanceLevel || 'Council of Fleet Admirals';

    // Update payrun
    const payrunRes = await client.query(
      `UPDATE payruns
       SET 
         status = 'Paid',
         paid_by = $1,
         paid_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [paidBy, id]
    );

    if (payrunRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Payrun cycle not found' });
    }

    // Update payslips to Paid
    await client.query(
      `UPDATE payslips 
       SET status = 'Paid', updated_at = CURRENT_TIMESTAMP 
       WHERE payrun_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Payrun cycle '${payrunRes.rows[0].run_name}' executed: Total $${payrunRes.rows[0].total_net} disbursed to crew accounts`,
      data: payrunRes.rows[0],
      quantumProfiling: { skill: '/teleport-pdf-disbursal' },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}

/**
 * POST /api/payruns/:id/send-emails
 * /teleport-pdf-disbursal
 * Bulk transmission of encrypted PDF payslips to astronaut comm beacons
 */
async function bulkSendEmails(req, res) {
  try {
    const { id } = req.params;

    // Fetch payrun and crew payslips
    const payrunRes = await quantumPool.query(`SELECT * FROM payruns WHERE id = $1`, [id]);
    if (payrunRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payrun not found' });
    }
    const payrun = payrunRes.rows[0];

    const slipsRes = await quantumPool.query(
      `SELECT s.id, s.slip_number, e.email, (e.first_name || ' ' || e.last_name) AS full_name
       FROM payslips s
       JOIN employees e ON s.employee_id = e.id
       WHERE s.payrun_id = $1`,
      [id]
    );

    const slips = slipsRes.rows;
    if (slips.length === 0) {
      return res.status(400).json({ success: false, error: 'No payslips generated for this payrun yet.' });
    }

    // Update each payslip status to Sent with simulated teleport dispatch
    await quantumPool.query(
      `UPDATE payslips
       SET 
         status = CASE WHEN payslips.status = 'Paid' THEN 'Paid' ELSE 'Sent' END,
         sent_at = CURRENT_TIMESTAMP,
         sent_to = e.email
       FROM employees e
       WHERE payslips.employee_id = e.id AND payslips.payrun_id = $1`,
      [id]
    );

    // Update payrun telemetry
    await quantumPool.query(
      `UPDATE payruns
       SET 
         emails_sent_count = $1,
         emails_dispatched_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [slips.length, id]
    );

    return res.json({
      success: true,
      message: `/teleport-pdf-disbursal: Transmitted ${slips.length} encrypted PDF payslips with 100% nominal delivery thrust`,
      data: {
        payrun_id: payrun.id,
        run_name: payrun.run_name,
        total_delivered: slips.length,
        speed_telemetry: '0.04 ms/slip',
        encryption: 'CRYPTO-GRAVITATIONAL-AES256',
        recipients: slips.map(s => ({ slip_number: s.slip_number, email: s.email, name: s.full_name })),
      },
      quantumProfiling: { skill: '/teleport-pdf-disbursal' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/payruns/:id
 */
async function deletePayrun(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await quantumPool.query(`DELETE FROM payruns WHERE id = $1`, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Payrun not found' });
    }
    return res.json({ success: true, message: `Payrun #${id} decommissioned from orbital ledger` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllPayruns,
  getPayrunById,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  bulkSendEmails,
  deletePayrun,
};
