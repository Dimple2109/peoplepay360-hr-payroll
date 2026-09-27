// ====================================================================
// Time Off Management Controller
// /zero-g-timeoff-allocator — Automated approvals, balance deductions,
// and validity period tracking for PeoplePay360
// ====================================================================

const quantumPool = require('../config/quantumPool');

// ─── 1. TIME OFF TYPES ──────────────────────────────────────────────

/**
 * GET /api/time-off/types
 */
async function getAllTypes(req, res) {
  try {
    const { rows } = await quantumPool.query(`
      SELECT * FROM time_off_types ORDER BY id ASC
    `);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/time-off/types
 */
async function createType(req, res) {
  try {
    const { code, name, description, default_days_per_year = 20, color_hex = '#00f0ff', requires_approval = true, is_paid = true } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'code and name are required' });
    }

    const { rows } = await quantumPool.query(`
      INSERT INTO time_off_types (code, name, description, default_days_per_year, color_hex, requires_approval, is_paid)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [code.toUpperCase(), name, description, default_days_per_year, color_hex, requires_approval, is_paid]);

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ─── 2. TIME OFF ALLOCATIONS (/zero-g-timeoff-allocator) ─────────────

/**
 * GET /api/time-off/allocations
 * Filter by employee_id or year
 */
async function getAllocations(req, res) {
  try {
    const { employee_id, year = 2026 } = req.query;

    let queryText = `
      SELECT 
        a.id,
        a.employee_id,
        a.time_off_type_id,
        a.year,
        a.total_days,
        a.used_days,
        a.remaining_days,
        a.valid_from,
        a.valid_to,
        a.notes,
        a.created_at,
        a.updated_at,
        ROUND((a.used_days / NULLIF(a.total_days, 0) * 100)::NUMERIC, 1) AS usage_percentage,
        t.code AS type_code,
        t.name AS type_name,
        t.color_hex,
        t.is_paid,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        d.name AS department_name
      FROM time_off_allocations a
      JOIN time_off_types t ON a.time_off_type_id = t.id
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (employee_id) {
      params.push(parseInt(employee_id, 10));
      queryText += ` AND a.employee_id = $${params.length}`;
    }

    if (year) {
      params.push(parseInt(year, 10));
      queryText += ` AND a.year = $${params.length}`;
    }

    queryText += ` ORDER BY e.id ASC, t.id ASC`;

    const { rows, thrustLatencyMs } = await quantumPool.query(queryText, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/zero-g-timeoff-allocator',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/time-off/allocations/:employeeId/summary
 * Live balance cards for an astronaut's dossier
 */
async function getEmployeeAllocationSummary(req, res) {
  try {
    const { employeeId } = req.params;
    const year = req.query.year || 2026;

    const query = `
      SELECT 
        a.id,
        a.time_off_type_id,
        a.total_days,
        a.used_days,
        a.remaining_days,
        a.valid_from,
        a.valid_to,
        ROUND((a.used_days / NULLIF(a.total_days, 0) * 100)::NUMERIC, 1) AS usage_percentage,
        t.code AS type_code,
        t.name AS type_name,
        t.color_hex,
        t.is_paid
      FROM time_off_allocations a
      JOIN time_off_types t ON a.time_off_type_id = t.id
      WHERE a.employee_id = $1 AND a.year = $2
      ORDER BY t.id ASC
    `;

    const { rows } = await quantumPool.query(query, [employeeId, year]);

    // Also fetch recent time-off requests
    const reqQuery = `
      SELECT 
        r.id,
        r.request_ref,
        r.start_date,
        r.end_date,
        r.duration_days,
        r.status,
        r.reason,
        t.name AS type_name,
        t.color_hex
      FROM time_off_requests r
      JOIN time_off_types t ON r.time_off_type_id = t.id
      WHERE r.employee_id = $1
      ORDER BY r.start_date DESC
      LIMIT 5
    `;
    const reqRes = await quantumPool.query(reqQuery, [employeeId]);

    return res.json({
      success: true,
      data: {
        balances: rows,
        recent_requests: reqRes.rows,
        year: parseInt(year, 10),
      },
      quantumProfiling: {
        skill: '/zero-g-timeoff-allocator',
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/time-off/allocations
 * Upsert or modify allocation
 */
async function setAllocation(req, res) {
  try {
    const { employee_id, time_off_type_id, year = 2026, total_days, notes } = req.body;
    if (!employee_id || !time_off_type_id || total_days === undefined) {
      return res.status(400).json({ success: false, error: 'employee_id, time_off_type_id, and total_days are required' });
    }

    const query = `
      INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, total_days, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, time_off_type_id, year)
      DO UPDATE SET 
        total_days = EXCLUDED.total_days,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const { rows } = await quantumPool.query(query, [employee_id, time_off_type_id, year, total_days, notes]);
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ─── 3. TIME OFF REQUESTS & APPROVAL ENGINE ──────────────────────────

/**
 * GET /api/time-off/requests
 */
async function getAllRequests(req, res) {
  try {
    const { employee_id, status, year, department_id, sortBy = 'created_at', order = 'DESC' } = req.query;

    let queryText = `
      SELECT 
        r.id,
        r.request_ref,
        r.employee_id,
        r.time_off_type_id,
        r.start_date,
        r.end_date,
        r.duration_days,
        r.reason,
        r.status,
        r.approved_by,
        r.approved_at,
        r.rejection_reason,
        r.created_at,
        r.updated_at,
        t.code AS type_code,
        t.name AS type_name,
        t.color_hex,
        t.is_paid,
        t.requires_approval,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        alloc.remaining_days AS current_balance_remaining
      FROM time_off_requests r
      JOIN time_off_types t ON r.time_off_type_id = t.id
      JOIN employees e ON r.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN time_off_allocations alloc ON (alloc.employee_id = r.employee_id AND alloc.time_off_type_id = r.time_off_type_id AND alloc.year = EXTRACT(YEAR FROM r.start_date))
      WHERE 1=1
    `;

    const params = [];

    if (employee_id) {
      params.push(parseInt(employee_id, 10));
      queryText += ` AND r.employee_id = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      queryText += ` AND r.status = $${params.length}`;
    }

    if (year) {
      params.push(parseInt(year, 10));
      queryText += ` AND EXTRACT(YEAR FROM r.start_date) = $${params.length}`;
    }

    if (department_id && department_id !== 'ALL') {
      params.push(department_id);
      queryText += ` AND (d.code = $${params.length} OR d.id::text = $${params.length})`;
    }

    const safeSort = ['created_at', 'start_date', 'id', 'duration_days'].includes(sortBy) ? `r.${sortBy}` : 'r.created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryText += ` ORDER BY ${safeSort} ${safeOrder}`;

    const { rows, thrustLatencyMs } = await quantumPool.query(queryText, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/zero-g-timeoff-allocator',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/time-off/requests
 * /zero-g-timeoff-allocator
 * Creates a leave request with automatic balance pre-flight validation
 */
async function createRequest(req, res) {
  try {
    const { employee_id, time_off_type_id, start_date, end_date, duration_days, reason } = req.body;

    if (!employee_id || !time_off_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'employee_id, time_off_type_id, start_date, and end_date are required' });
    }

    const sDate = new Date(start_date);
    const eDate = new Date(end_date);
    if (eDate < sDate) {
      return res.status(400).json({ success: false, error: 'end_date cannot precede start_date in orbital timeline' });
    }

    // Compute duration in days if not provided
    let duration = duration_days ? parseFloat(duration_days) : Math.max(1, Math.round((eDate - sDate) / (1000 * 3600 * 24)) + 1);

    const year = sDate.getFullYear();

    // /zero-g-timeoff-allocator Balance Pre-Check
    const allocRes = await quantumPool.query(`
      SELECT total_days, used_days, remaining_days, valid_from, valid_to
      FROM time_off_allocations
      WHERE employee_id = $1 AND time_off_type_id = $2 AND year = $3
    `, [employee_id, time_off_type_id, year]);

    if (allocRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: `/zero-g-timeoff-allocator: No leave allocation found for astronaut #${employee_id} in year ${year}. Please allocate days first.`,
      });
    }

    const allocation = allocRes.rows[0];
    const remaining = parseFloat(allocation.remaining_days);

    if (remaining < duration) {
      return res.status(400).json({
        success: false,
        error: `/zero-g-timeoff-allocator: Insufficient balance. Available: ${remaining} days, Requested: ${duration} days.`,
      });
    }

    // Verify validity period
    const validFrom = new Date(allocation.valid_from);
    const validTo = new Date(allocation.valid_to);
    if (sDate < validFrom || eDate > validTo) {
      return res.status(400).json({
        success: false,
        error: `/zero-g-timeoff-allocator: Requested period lies outside allocation validity (${allocation.valid_from} to ${allocation.valid_to}).`,
      });
    }

    // Check leave policy type if requires approval
    const typeRes = await quantumPool.query(`SELECT requires_approval, name FROM time_off_types WHERE id = $1`, [time_off_type_id]);
    const requiresApproval = typeRes.rows.length > 0 ? typeRes.rows[0].requires_approval : true;
    const initialStatus = requiresApproval ? 'Pending' : 'Approved';

    const insertQuery = `
      INSERT INTO time_off_requests (
        employee_id, time_off_type_id, start_date, end_date, duration_days, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(insertQuery, [
      employee_id,
      time_off_type_id,
      start_date,
      end_date,
      duration,
      reason,
      initialStatus
    ]);

    // If auto-approved (e.g. Emergency solar leave) deduct balance immediately
    if (initialStatus === 'Approved') {
      await quantumPool.query(`
        UPDATE time_off_allocations
        SET used_days = used_days + $1, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND time_off_type_id = $3 AND year = $4
      `, [duration, employee_id, time_off_type_id, year]);
    }

    return res.status(201).json({
      success: true,
      message: `Time off request ${rows[0].request_ref || `#${rows[0].id}`} logged with status: ${initialStatus}`,
      data: rows[0],
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/zero-g-timeoff-allocator',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PATCH /api/time-off/requests/:id/approve
 * /zero-g-timeoff-allocator
 * Atomic leave balance deduction upon approval
 */
async function approveRequest(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    // Retrieve request
    const reqRes = await client.query(`
      SELECT r.*, t.name AS type_name
      FROM time_off_requests r
      JOIN time_off_types t ON r.time_off_type_id = t.id
      WHERE r.id = $1 FOR UPDATE
    `, [id]);

    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Time off request not found' });
    }

    const leaveReq = reqRes.rows[0];
    if (leaveReq.status === 'Approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Request has already been approved' });
    }

    const year = new Date(leaveReq.start_date).getFullYear();

    // Check balance in allocation
    const allocRes = await client.query(`
      SELECT id, total_days, used_days, remaining_days
      FROM time_off_allocations
      WHERE employee_id = $1 AND time_off_type_id = $2 AND year = $3
      FOR UPDATE
    `, [leaveReq.employee_id, leaveReq.time_off_type_id, year]);

    if (allocRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `/zero-g-timeoff-allocator: No allocation record found for employee #${leaveReq.employee_id}`,
      });
    }

    const allocation = allocRes.rows[0];
    const duration = parseFloat(leaveReq.duration_days);

    if (parseFloat(allocation.remaining_days) < duration) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `/zero-g-timeoff-allocator: Cannot approve request. Remaining balance (${allocation.remaining_days} days) is less than requested duration (${duration} days).`,
      });
    }

    // 1. Deduct balance from allocation
    await client.query(`
      UPDATE time_off_allocations
      SET used_days = used_days + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [duration, allocation.id]);

    // 2. Mark request as Approved
    const approvedBy = req.user?.clearanceLevel || 'Level-5 Fleet Admiral';
    const updateReqRes = await client.query(`
      UPDATE time_off_requests
      SET 
        status = 'Approved',
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [approvedBy, id]);

    // 3. If today is within leave range, update employee status to 'On-Leave'
    const today = new Date().toISOString().split('T')[0];
    if (today >= leaveReq.start_date.toISOString().split('T')[0] && today <= leaveReq.end_date.toISOString().split('T')[0]) {
      await client.query(`
        UPDATE employees SET status = 'On-Leave', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [leaveReq.employee_id]);

      // Record On-Leave in attendance_logs for today if not already marked
      await client.query(`
        INSERT INTO attendance_logs (employee_id, date, status, notes)
        VALUES ($1, $2, 'On-Leave', $3)
        ON CONFLICT DO NOTHING
      `, [leaveReq.employee_id, today, `Approved leave: ${leaveReq.type_name}`]);
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Leave request ${leaveReq.request_ref || `#${id}`} approved. Deducted ${duration} days from allocation.`,
      data: updateReqRes.rows[0],
      quantumProfiling: {
        skill: '/zero-g-timeoff-allocator',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approval transaction fault:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/time-off/requests/:id/refuse
 * Refuses/rejects a leave request; restores balance if was previously approved
 */
async function refuseRequest(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    await client.query('BEGIN');

    const reqRes = await client.query(`
      SELECT * FROM time_off_requests WHERE id = $1 FOR UPDATE
    `, [id]);

    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Time off request not found' });
    }

    const leaveReq = reqRes.rows[0];

    // If previously approved, refund deducted days
    if (leaveReq.status === 'Approved') {
      const year = new Date(leaveReq.start_date).getFullYear();
      await client.query(`
        UPDATE time_off_allocations
        SET used_days = GREATEST(0, used_days - $1), updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND time_off_type_id = $3 AND year = $4
      `, [parseFloat(leaveReq.duration_days), leaveReq.employee_id, leaveReq.time_off_type_id, year]);
    }

    const updateRes = await client.query(`
      UPDATE time_off_requests
      SET 
        status = 'Refused',
        rejection_reason = $1,
        approved_by = NULL,
        approved_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [rejection_reason || 'Orbital mission duty conflict', id]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Time off request ${leaveReq.request_ref || `#${id}`} refused`,
      data: updateRes.rows[0],
      quantumProfiling: {
        skill: '/zero-g-timeoff-allocator',
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/time-off/requests/:id
 * Cancels a request, rolling back balance if approved
 */
async function deleteRequest(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const reqRes = await client.query(`SELECT * FROM time_off_requests WHERE id = $1`, [id]);
    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const leaveReq = reqRes.rows[0];
    if (leaveReq.status === 'Approved') {
      const year = new Date(leaveReq.start_date).getFullYear();
      await client.query(`
        UPDATE time_off_allocations
        SET used_days = GREATEST(0, used_days - $1), updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND time_off_type_id = $3 AND year = $4
      `, [parseFloat(leaveReq.duration_days), leaveReq.employee_id, leaveReq.time_off_type_id, year]);
    }

    await client.query(`DELETE FROM time_off_requests WHERE id = $1`, [id]);
    await client.query('COMMIT');

    return res.json({ success: true, message: `Request #${id} cancelled and allocation balance restored` });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}

/**
 * GET /api/time-off/stats
 * Overview KPIs for Time Off Cockpit
 */
async function getTimeOffStats(req, res) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM time_off_requests WHERE status = 'Pending') AS pending_requests_count,
        (SELECT COUNT(*) FROM time_off_requests WHERE status = 'Approved' AND EXTRACT(MONTH FROM start_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS approved_this_month,
        (SELECT COUNT(DISTINCT employee_id) FROM time_off_requests WHERE status = 'Approved' AND $1 >= start_date AND $1 <= end_date) AS crew_on_leave_today,
        (SELECT COALESCE(SUM(total_days), 0) FROM time_off_allocations WHERE year = 2026) AS total_days_allocated,
        (SELECT COALESCE(SUM(used_days), 0) FROM time_off_allocations WHERE year = 2026) AS total_days_used,
        (SELECT COALESCE(SUM(remaining_days), 0) FROM time_off_allocations WHERE year = 2026) AS total_days_remaining
    `;

    const { rows } = await quantumPool.query(statsQuery, [todayStr]);
    return res.json({
      success: true,
      data: rows[0],
      quantumProfiling: {
        skill: '/zero-g-timeoff-allocator',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllTypes,
  createType,
  getAllocations,
  getEmployeeAllocationSummary,
  setAllocation,
  getAllRequests,
  createRequest,
  approveRequest,
  refuseRequest,
  deleteRequest,
  getTimeOffStats,
};
