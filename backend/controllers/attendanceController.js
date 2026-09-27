// ====================================================================
// Attendance Management Controller
// /orbital-attendance-sync   — Real-time check-in/out & worked hours
// /gravity-exception-detector — Flags missing checkouts, late entries, manual edits
// ====================================================================

const quantumPool = require('../config/quantumPool');

/**
 * Helper: Parse shift start time from schedule string or working_schedules
 */
function getExpectedStartTime(scheduleStr) {
  if (!scheduleStr) return { hour: 9, minute: 0 };
  const str = scheduleStr.toUpperCase();
  if (str.includes('6AM') || str.includes('06:00') || str.includes('ALPHA')) {
    return { hour: 6, minute: 0 };
  }
  if (str.includes('8AM') || str.includes('08:00')) {
    return { hour: 8, minute: 0 };
  }
  if (str.includes('9AM') || str.includes('09:00') || str.includes('EARTH')) {
    return { hour: 9, minute: 0 };
  }
  return { hour: 9, minute: 0 };
}

/**
 * GET /api/attendance
 * Retrieves attendance logs with employee and department details
 */
async function getAllAttendance(req, res) {
  try {
    const { 
      employee_id, 
      date, 
      start_date, 
      end_date, 
      status, 
      exceptions_only, 
      department_id, 
      sortBy = 'date', 
      order = 'DESC' 
    } = req.query;

    let queryText = `
      SELECT 
        a.id,
        a.employee_id,
        a.date,
        a.check_in,
        a.check_out,
        a.worked_hours,
        a.status,
        a.is_manual_override,
        a.override_reason,
        a.override_by,
        a.is_exception,
        a.exception_type,
        a.exception_notes,
        a.notes,
        a.created_at,
        a.updated_at,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        e.schedule,
        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        d.orbital_deck
      FROM attendance_logs a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (employee_id) {
      queryParams.push(parseInt(employee_id, 10));
      queryText += ` AND a.employee_id = $${queryParams.length}`;
    }

    if (date) {
      queryParams.push(date);
      queryText += ` AND a.date = $${queryParams.length}`;
    }

    if (start_date) {
      queryParams.push(start_date);
      queryText += ` AND a.date >= $${queryParams.length}`;
    }

    if (end_date) {
      queryParams.push(end_date);
      queryText += ` AND a.date <= $${queryParams.length}`;
    }

    if (status && status !== 'ALL') {
      queryParams.push(status);
      queryText += ` AND a.status = $${queryParams.length}`;
    }

    if (exceptions_only === 'true' || exceptions_only === true) {
      queryText += ` AND (a.is_exception = TRUE OR a.is_manual_override = TRUE)`;
    }

    if (department_id && department_id !== 'ALL') {
      queryParams.push(department_id);
      queryText += ` AND (d.code = $${queryParams.length} OR d.id::text = $${queryParams.length})`;
    }

    const allowedSort = ['date', 'id', 'check_in', 'worked_hours', 'status'];
    const safeSort = allowedSort.includes(sortBy) ? `a.${sortBy}` : 'a.date';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryText += ` ORDER BY ${safeSort} ${safeOrder}, a.id DESC`;

    const { rows, thrustLatencyMs } = await quantumPool.query(queryText, queryParams);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/orbital-attendance-sync',
      },
    });
  } catch (error) {
    console.error('Error in getAllAttendance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orbital attendance logs',
      details: error.message,
    });
  }
}

/**
 * GET /api/attendance/:id
 */
async function getAttendanceById(req, res) {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT 
        a.*,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        e.schedule,
        d.name AS department_name
      FROM attendance_logs a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.id = $1
    `;
    const { rows } = await quantumPool.query(queryText, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/attendance/check-in
 * /orbital-attendance-sync
 * Instantaneous crew check-in with shift comparison & /gravity-exception-detector
 */
async function checkIn(req, res) {
  try {
    const { employee_id, notes, timestamp } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, error: 'employee_id is required for orbital check-in' });
    }

    const checkInTime = timestamp ? new Date(timestamp) : new Date();
    const todayStr = checkInTime.toISOString().split('T')[0];

    // Check if an unclosed attendance record already exists for today
    const existingQuery = `
      SELECT id, check_in, check_out FROM attendance_logs
      WHERE employee_id = $1 AND date = $2 AND check_out IS NULL
    `;
    const existingRes = await quantumPool.query(existingQuery, [employee_id, todayStr]);
    if (existingRes.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Astronaut #${employee_id} already has an active orbital check-in today without checkout (Log #${existingRes.rows[0].id})`,
      });
    }

    // Lookup employee schedule
    const empRes = await quantumPool.query(
      `SELECT id, first_name, last_name, schedule, clearance_tier FROM employees WHERE id = $1`,
      [employee_id]
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found in registry' });
    }
    const emp = empRes.rows[0];

    // Evaluate Late Entry using /gravity-exception-detector
    const expected = getExpectedStartTime(emp.schedule);
    const expectedTimeToday = new Date(checkInTime);
    expectedTimeToday.setHours(expected.hour, expected.minute, 0, 0);

    const diffMins = Math.round((checkInTime - expectedTimeToday) / (1000 * 60));
    let status = 'Present';
    let isException = false;
    let exceptionType = null;
    let exceptionNotes = null;

    if (diffMins > 15) {
      status = 'Late';
      isException = true;
      exceptionType = 'LATE_ENTRY';
      exceptionNotes = `/gravity-exception-detector: Checked in ${diffMins} minutes past scheduled shift start (${expected.hour.toString().padStart(2, '0')}:${expected.minute.toString().padStart(2, '0')})`;
    }

    const insertQuery = `
      INSERT INTO attendance_logs (
        employee_id, date, check_in, status, is_exception, exception_type, exception_notes, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(insertQuery, [
      employee_id,
      todayStr,
      checkInTime,
      status,
      isException,
      exceptionType,
      exceptionNotes,
      notes || `Real-time orbital check-in via ${req.user?.clearanceLevel || 'Fleet Hub'}`
    ]);

    return res.status(201).json({
      success: true,
      message: `Astronaut ${emp.first_name} ${emp.last_name} check-in registered (${status})`,
      data: rows[0],
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/orbital-attendance-sync',
      },
    });
  } catch (error) {
    console.error('Error in checkIn:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/attendance/check-out
 * /orbital-attendance-sync
 * Precision check-out with worked hours calculation & overtime detection
 */
async function checkOut(req, res) {
  try {
    const { employee_id, attendance_id, notes, timestamp } = req.body;
    if (!employee_id && !attendance_id) {
      return res.status(400).json({ success: false, error: 'employee_id or attendance_id is required for check-out' });
    }

    const checkOutTime = timestamp ? new Date(timestamp) : new Date();

    let targetLog;
    if (attendance_id) {
      const logRes = await quantumPool.query(`SELECT * FROM attendance_logs WHERE id = $1`, [attendance_id]);
      if (logRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Attendance log not found' });
      targetLog = logRes.rows[0];
    } else {
      // Find latest unclosed check-in for this employee
      const logRes = await quantumPool.query(`
        SELECT * FROM attendance_logs
        WHERE employee_id = $1 AND check_out IS NULL
        ORDER BY check_in DESC LIMIT 1
      `, [employee_id]);
      if (logRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'No active open check-in record found for astronaut' });
      }
      targetLog = logRes.rows[0];
    }

    if (targetLog.check_out) {
      return res.status(400).json({ success: false, error: 'Shift is already checked out' });
    }

    const checkInTime = new Date(targetLog.check_in);
    const durationHours = parseFloat(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2));

    // Overtime & Exception rules
    let newStatus = targetLog.status;
    let isException = targetLog.is_exception;
    let exceptionType = targetLog.exception_type;
    let exceptionNotes = targetLog.exception_notes;

    if (durationHours >= 8.5 && newStatus === 'Present') {
      newStatus = 'Overtime';
    }

    if (durationHours > 12.0) {
      isException = true;
      exceptionType = 'EXCESSIVE_OVERTIME';
      exceptionNotes = `/gravity-exception-detector: Shift duration reached ${durationHours} hours without rotation dampeners. Requires Admiral sign-off.`;
    }

    const updateQuery = `
      UPDATE attendance_logs
      SET 
        check_out = $1,
        worked_hours = $2,
        status = $3,
        is_exception = $4,
        exception_type = $5,
        exception_notes = $6,
        notes = COALESCE($7, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(updateQuery, [
      checkOutTime,
      durationHours,
      newStatus,
      isException,
      exceptionType,
      exceptionNotes,
      notes ? `${targetLog.notes || ''} | Out: ${notes}` : targetLog.notes,
      targetLog.id
    ]);

    return res.json({
      success: true,
      message: `Astronaut shift checked out successfully. Worked: ${durationHours} hrs (${newStatus})`,
      data: rows[0],
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/orbital-attendance-sync',
      },
    });
  } catch (error) {
    console.error('Error in checkOut:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/attendance
 * Manual creation of an attendance log with override reason & caller clearance
 */
async function createManualAttendance(req, res) {
  try {
    const {
      employee_id,
      date,
      check_in,
      check_out,
      status = 'Present',
      override_reason,
      notes
    } = req.body;

    if (!employee_id || !date) {
      return res.status(400).json({ success: false, error: 'employee_id and date are required' });
    }

    let worked_hours = 0.00;
    if (check_in && check_out) {
      worked_hours = parseFloat(((new Date(check_out) - new Date(check_in)) / (1000 * 3600)).toFixed(2));
    }

    const overrideBy = req.user?.clearanceLevel || 'Authorized Officer';
    const isManual = true;
    const isException = true;
    const exceptionType = 'MANUAL_EDIT';
    const exceptionNotes = `/gravity-exception-detector: Manual attendance insertion logged by ${overrideBy}`;

    const query = `
      INSERT INTO attendance_logs (
        employee_id, date, check_in, check_out, worked_hours, status,
        is_manual_override, override_reason, override_by,
        is_exception, exception_type, exception_notes, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const { rows } = await quantumPool.query(query, [
      employee_id,
      date,
      check_in || null,
      check_out || null,
      worked_hours,
      status,
      isManual,
      override_reason || 'Manual retrospective attendance log creation',
      overrideBy,
      isException,
      exceptionType,
      exceptionNotes,
      notes
    ]);

    return res.status(201).json({
      success: true,
      message: 'Manual attendance log created with anti-gravity audit signature',
      data: rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/attendance/:id
 * Manual correction and override of attendance record
 * /gravity-exception-detector flags manual edits
 */
async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const {
      check_in,
      check_out,
      status,
      override_reason,
      notes,
      resolve_exception
    } = req.body;

    const currentRes = await quantumPool.query(`SELECT * FROM attendance_logs WHERE id = $1`, [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    const current = currentRes.rows[0];

    const newCheckIn = check_in !== undefined ? (check_in ? new Date(check_in) : null) : current.check_in;
    const newCheckOut = check_out !== undefined ? (check_out ? new Date(check_out) : null) : current.check_out;

    let worked_hours = current.worked_hours;
    if (newCheckIn && newCheckOut) {
      worked_hours = parseFloat(((new Date(newCheckOut) - new Date(newCheckIn)) / (1000 * 3600)).toFixed(2));
    } else if (!newCheckOut) {
      worked_hours = 0.00;
    }

    const callerClearance = req.user?.clearanceLevel || 'Level-4 Commander';
    const isManual = true;
    let isException = resolve_exception ? false : true;
    let exceptionType = resolve_exception ? null : 'MANUAL_EDIT';
    let exceptionNotes = resolve_exception
      ? `Exception resolved by ${callerClearance}: ${override_reason || 'Calibrated'}`
      : `/gravity-exception-detector: Manual correction applied by ${callerClearance}. Reason: ${override_reason || 'Administrative adjustment'}`;

    const updateQuery = `
      UPDATE attendance_logs
      SET 
        check_in = $1,
        check_out = $2,
        worked_hours = $3,
        status = COALESCE($4, status),
        is_manual_override = $5,
        override_reason = COALESCE($6, override_reason),
        override_by = $7,
        is_exception = $8,
        exception_type = $9,
        exception_notes = $10,
        notes = COALESCE($11, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const { rows } = await quantumPool.query(updateQuery, [
      newCheckIn,
      newCheckOut,
      worked_hours,
      status,
      isManual,
      override_reason,
      callerClearance,
      isException,
      exceptionType,
      exceptionNotes,
      notes,
      id
    ]);

    return res.json({
      success: true,
      message: 'Attendance record recalibrated with anti-gravity audit signature',
      data: rows[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/attendance/:id
 */
async function deleteAttendance(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await quantumPool.query(`DELETE FROM attendance_logs WHERE id = $1`, [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }
    return res.json({ success: true, message: `Attendance record #${id} removed from orbital logs` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/attendance/exceptions
 * /gravity-exception-detector
 * Scans for missing check-outs, late entries, manual overrides, and unclosed historical shifts
 */
async function getExceptions(req, res) {
  try {
    // 1. Identify missing check-outs dynamically (past shifts or shifts open > 10 hours)
    await quantumPool.query(`
      UPDATE attendance_logs
      SET 
        is_exception = TRUE,
        exception_type = 'MISSING_CHECKOUT',
        exception_notes = '/gravity-exception-detector: Open shift past 10-hour threshold without terminal checkout beacon.'
      WHERE check_out IS NULL 
        AND is_exception = FALSE
        AND (
          date < CURRENT_DATE 
          OR (date = CURRENT_DATE AND (CURRENT_TIMESTAMP - check_in) > INTERVAL '10 hours')
        )
    `);

    const query = `
      SELECT 
        a.*,
        e.employee_id AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        e.schedule,
        d.name AS department_name
      FROM attendance_logs a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.is_exception = TRUE OR a.is_manual_override = TRUE
      ORDER BY a.date DESC, a.id DESC
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(query);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: {
        thrustLatencyMs,
        skill: '/gravity-exception-detector',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/attendance/stats
 * Real-time operational statistics for the orbital attendance cockpit
 */
async function getAttendanceStats(req, res) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const statsQuery = `
      SELECT
        (SELECT COUNT(DISTINCT id) FROM employees WHERE status = 'Active') AS total_active_crew,
        (SELECT COUNT(*) FROM attendance_logs WHERE date = $1 AND (status = 'Present' OR status = 'Overtime' OR status = 'Late')) AS present_today,
        (SELECT COUNT(*) FROM attendance_logs WHERE date = $1 AND check_out IS NULL AND check_in IS NOT NULL) AS active_shifts_open,
        (SELECT COUNT(*) FROM attendance_logs WHERE date = $1 AND status = 'Late') AS late_today,
        (SELECT COUNT(*) FROM attendance_logs WHERE is_exception = TRUE) AS total_unresolved_exceptions,
        (SELECT COUNT(*) FROM attendance_logs WHERE is_manual_override = TRUE) AS total_manual_overrides,
        (SELECT COALESCE(ROUND(AVG(worked_hours), 2), 0) FROM attendance_logs WHERE date >= CURRENT_DATE - INTERVAL '7 days' AND worked_hours > 0) AS avg_hours_week,
        (SELECT COALESCE(ROUND(SUM(worked_hours), 2), 0) FROM attendance_logs WHERE date = $1) AS total_hours_today
    `;

    const { rows } = await quantumPool.query(statsQuery, [todayStr]);
    return res.json({
      success: true,
      data: rows[0],
      quantumProfiling: {
        skill: '/orbital-attendance-sync',
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  createManualAttendance,
  updateAttendance,
  deleteAttendance,
  getExceptions,
  getAttendanceStats,
};
