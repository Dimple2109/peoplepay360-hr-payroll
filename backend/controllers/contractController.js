// ====================================================================
// Contract Management Controller
// /temporal-contract-sync  — Period-based versioning & no concurrent active
// /gravitational-wage-tier — Base salary + gravity allowance validation
// Ensures payroll engine only targets the active contract valid for
// the specific payroll period requested.
// ====================================================================

const quantumPool = require('../config/quantumPool');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute the net (total) compensation for display.
 */
function computeTotalCompensation(base_salary, gravity_allowance) {
  return parseFloat(base_salary || 0) + parseFloat(gravity_allowance || 0);
}

/**
 * /gravitational-wage-tier validation
 * Ensures salary & allowance meet the minimum quantum thresholds.
 */
function validateWageTier(base_salary, gravity_allowance, salary_structure) {
  const MIN_BASE = 30000;
  const MIN_GA   = 0;
  const errors   = [];

  if (parseFloat(base_salary) < MIN_BASE) {
    errors.push(`base_salary must be ≥ ${MIN_BASE} (gravitational wage floor).`);
  }
  if (parseFloat(gravity_allowance) < MIN_GA) {
    errors.push('gravity_allowance cannot be negative.');
  }
  if (!salary_structure || salary_structure.trim().length < 3) {
    errors.push('salary_structure must be specified (min 3 characters).');
  }
  return errors;
}

// ─── GET ALL Contracts ───────────────────────────────────────────────────────

/**
 * GET /api/contracts?employee_id=&status=&payroll_period=
 * Supports payroll_period (YYYY-MM-DD) to filter the contract valid on that date.
 */
async function getAllContracts(req, res) {
  try {
    const { employee_id, status, payroll_period } = req.query;

    let query = `
      SELECT
        c.*,
        e.employee_id   AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        d.name AS department_name,
        (c.base_salary + c.gravity_allowance) AS total_compensation
      FROM contracts c
      JOIN employees e ON e.id = c.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      params.push(parseInt(employee_id, 10));
      query += ` AND c.employee_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    // /temporal-contract-sync: payroll period targeting
    // Returns the contract(s) whose date range covers the supplied period date.
    if (payroll_period) {
      params.push(payroll_period);
      query += ` AND c.start_date <= $${params.length}::DATE
                 AND (c.end_date IS NULL OR c.end_date >= $${params.length}::DATE)`;
    }

    query += ` ORDER BY c.employee_id, c.start_date DESC`;

    const { rows, thrustLatencyMs } = await quantumPool.query(query, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (err) {
    console.error('[CONTRACT] getAllContracts error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET Contract by ID ──────────────────────────────────────────────────────

async function getContractById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await quantumPool.query(`
      SELECT
        c.*,
        e.employee_id   AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        d.name AS department_name,
        (c.base_salary + c.gravity_allowance) AS total_compensation
      FROM contracts c
      JOIN employees e ON e.id = c.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE c.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: `Contract #${id} not found in orbital registry.` });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET Active Contract for Employee (payroll engine entry point) ────────────

/**
 * GET /api/contracts/active/:employeeId?payroll_period=YYYY-MM-DD
 * /temporal-contract-sync: returns the single active contract valid on a given date.
 */
async function getActiveContractForEmployee(req, res) {
  try {
    const { employeeId } = req.params;
    const { payroll_period } = req.query;
    const targetDate = payroll_period || new Date().toISOString().slice(0, 10);

    const { rows } = await quantumPool.query(`
      SELECT
        c.*,
        (c.base_salary + c.gravity_allowance) AS total_compensation
      FROM contracts c
      WHERE c.employee_id = $1
        AND c.status = 'active'
        AND c.start_date <= $2::DATE
        AND (c.end_date IS NULL OR c.end_date >= $2::DATE)
      LIMIT 1
    `, [employeeId, targetDate]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No active contract found for employee #${employeeId} covering ${targetDate}.`,
      });
    }

    return res.json({ success: true, data: rows[0], payroll_period: targetDate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── CREATE Contract ─────────────────────────────────────────────────────────

async function createContract(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    await client.query('BEGIN');

    const {
      employee_id,
      start_date,
      end_date,
      base_salary       = 100000.00,
      gravity_allowance = 12000.00,
      salary_structure  = 'Standard Quantum Compensation',
      currency          = 'USD',
      contract_type     = 'Full-Time Quantum Sync',
      contract_ref,
      status            = 'draft',
      notes,
    } = req.body;

    // Required fields
    if (!employee_id || !start_date) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'employee_id and start_date are required.',
      });
    }

    // /gravitational-wage-tier validation
    const wageErrors = validateWageTier(base_salary, gravity_allowance, salary_structure);
    if (wageErrors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: wageErrors.join(' | ') });
    }

    // /temporal-contract-sync: Date range sanity
    if (end_date && new Date(end_date) <= new Date(start_date)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'end_date must be after start_date (temporal sync violation).',
      });
    }

    // /temporal-contract-sync: Check for overlapping non-draft contracts
    const overlapCheck = await client.query(`
      SELECT id, contract_ref, start_date, end_date, status
      FROM contracts
      WHERE employee_id = $1
        AND status != 'historical'
        AND (
          (start_date <= COALESCE($3::DATE, '9999-12-31') AND (end_date IS NULL OR end_date >= $2::DATE))
        )
    `, [employee_id, start_date, end_date || null]);

    if (overlapCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      const conflict = overlapCheck.rows[0];
      return res.status(409).json({
        success: false,
        error: `Temporal conflict: An overlapping ${conflict.status} contract (${conflict.contract_ref || `#${conflict.id}`}) already exists for this employee.`,
        conflict: conflict,
      });
    }

    const { rows } = await client.query(`
      INSERT INTO contracts (
        employee_id, start_date, end_date,
        base_salary, gravity_allowance, salary_structure, currency,
        contract_type, contract_ref, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      parseInt(employee_id, 10),
      start_date,
      end_date || null,
      parseFloat(base_salary),
      parseFloat(gravity_allowance),
      salary_structure,
      currency,
      contract_type,
      contract_ref || null,
      status,
      notes || null,
    ]);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: `Contract ${rows[0].contract_ref} created successfully.`,
      data: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CONTRACT] createContract error:', err);
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Concurrent active contract constraint violated — this employee already has an active contract.',
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// ─── UPDATE Contract ─────────────────────────────────────────────────────────

async function updateContract(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updates = req.body;

    // Fetch existing contract
    const existing = await client.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: `Contract #${id} not found.` });
    }

    const curr = existing.rows[0];

    // /gravitational-wage-tier re-validation on salary changes
    const newBase = updates.base_salary !== undefined ? parseFloat(updates.base_salary) : parseFloat(curr.base_salary);
    const newGA   = updates.gravity_allowance !== undefined ? parseFloat(updates.gravity_allowance) : parseFloat(curr.gravity_allowance);
    const newSS   = updates.salary_structure || curr.salary_structure;

    const wageErrors = validateWageTier(newBase, newGA, newSS);
    if (wageErrors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: wageErrors.join(' | ') });
    }

    const newStart  = updates.start_date || curr.start_date;
    const newEnd    = updates.end_date !== undefined ? updates.end_date : curr.end_date;
    const newStatus = updates.status || curr.status;

    // /temporal-contract-sync: No status regression from 'historical' to 'active'
    if (curr.status === 'historical' && newStatus === 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Cannot reactivate a historical contract — create a new draft instead.',
      });
    }

    const { rows } = await client.query(`
      UPDATE contracts SET
        start_date        = COALESCE($1, start_date),
        end_date          = $2,
        base_salary       = $3,
        gravity_allowance = $4,
        salary_structure  = COALESCE($5, salary_structure),
        currency          = COALESCE($6, currency),
        contract_type     = COALESCE($7, contract_type),
        contract_ref      = COALESCE($8, contract_ref),
        status            = COALESCE($9, status),
        notes             = COALESCE($10, notes),
        updated_at        = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      updates.start_date || null,
      newEnd || null,
      newBase,
      newGA,
      updates.salary_structure || null,
      updates.currency || null,
      updates.contract_type || null,
      updates.contract_ref || null,
      updates.status || null,
      updates.notes !== undefined ? updates.notes : null,
      id,
    ]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Contract recalibrated successfully.',
      data: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CONTRACT] updateContract error:', err);
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Update would violate active-contract uniqueness constraint.',
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// ─── DELETE Contract ─────────────────────────────────────────────────────────

async function deleteContract(req, res) {
  try {
    const { id } = req.params;

    const check = await quantumPool.query('SELECT status FROM contracts WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Contract #${id} not found.` });
    }
    if (check.rows[0].status === 'active') {
      return res.status(403).json({
        success: false,
        error: 'Active contracts cannot be deleted. Archive to historical first.',
      });
    }

    await quantumPool.query('DELETE FROM contracts WHERE id = $1', [id]);

    return res.json({ success: true, message: `Contract #${id} decommissioned from orbital registry.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── ACTIVATE Contract (status transition) ───────────────────────────────────

/**
 * PATCH /api/contracts/:id/activate
 * /temporal-contract-sync: transitions draft → active, archiving any
 * previously active contract for the same employee.
 */
async function activateContract(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const existing = await client.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: `Contract #${id} not found.` });
    }

    const contract = existing.rows[0];
    if (contract.status === 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Contract is already active.' });
    }
    if (contract.status === 'historical') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Cannot activate a historical contract.' });
    }

    // /temporal-contract-sync: Archive any currently active contract for this employee
    await client.query(`
      UPDATE contracts
      SET status = 'historical', end_date = COALESCE(end_date, CURRENT_DATE - 1), updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $1 AND status = 'active' AND id != $2
    `, [contract.employee_id, id]);

    // Activate this contract
    const { rows } = await client.query(`
      UPDATE contracts SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [id]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Contract ${rows[0].contract_ref} activated. Previous active contract archived to historical.`,
      data: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[CONTRACT] activateContract error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// ─── GET Employee Contract History ───────────────────────────────────────────

async function getEmployeeContractHistory(req, res) {
  try {
    const { employeeId } = req.params;

    const { rows } = await quantumPool.query(`
      SELECT
        c.*,
        (c.base_salary + c.gravity_allowance) AS total_compensation
      FROM contracts c
      WHERE c.employee_id = $1
      ORDER BY c.start_date DESC
    `, [employeeId]);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllContracts,
  getContractById,
  getActiveContractForEmployee,
  getEmployeeContractHistory,
  createContract,
  updateContract,
  deleteContract,
  activateContract,
};
