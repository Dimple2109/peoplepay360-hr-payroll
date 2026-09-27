// ====================================================================
// Working Schedule Controller
// /orbital-schedule-engine — Automated weekly hours & shift pattern assignments
// Manages per-employee weekly shift patterns with computed hours.
// ====================================================================

const quantumPool = require('../config/quantumPool');

// ─── Helper: JS-side weekly hours calculator (mirrors PG trigger) ────────────
function calculateWeeklyHours(schedule) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let totalMins = 0;

  for (const day of days) {
    const start = schedule[`${day}_start`];
    const end   = schedule[`${day}_end`];
    const brk   = parseInt(schedule[`${day}_break_mins`] || 0, 10);

    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm) - brk;
      totalMins += Math.max(0, diffMins);
    }
  }

  return Math.round((totalMins / 60) * 100) / 100;
}

// ─── GET ALL Schedules ────────────────────────────────────────────────────────

async function getAllSchedules(req, res) {
  try {
    const { employee_id, is_active } = req.query;

    let query = `
      SELECT
        ws.*,
        e.employee_id   AS emp_code,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.avatar_url,
        e.job_position,
        d.name AS department_name
      FROM working_schedules ws
      JOIN employees e ON e.id = ws.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      params.push(parseInt(employee_id, 10));
      query += ` AND ws.employee_id = $${params.length}`;
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND ws.is_active = $${params.length}`;
    }

    query += ` ORDER BY ws.employee_id, ws.effective_date DESC`;

    const { rows, thrustLatencyMs } = await quantumPool.query(query, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (err) {
    console.error('[SCHEDULE] getAllSchedules error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET Schedule by ID ───────────────────────────────────────────────────────

async function getScheduleById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await quantumPool.query(`
      SELECT ws.*, e.first_name, e.last_name, (e.first_name || ' ' || e.last_name) AS full_name
      FROM working_schedules ws
      JOIN employees e ON e.id = ws.employee_id
      WHERE ws.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: `Schedule #${id} not found.` });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET Active Schedule for Employee ────────────────────────────────────────

async function getActiveScheduleForEmployee(req, res) {
  try {
    const { employeeId } = req.params;
    const { rows } = await quantumPool.query(`
      SELECT ws.*
      FROM working_schedules ws
      WHERE ws.employee_id = $1 AND ws.is_active = TRUE
      ORDER BY ws.effective_date DESC
      LIMIT 1
    `, [employeeId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: `No active schedule for employee #${employeeId}.` });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── GET Employee Schedule History ────────────────────────────────────────────

async function getEmployeeScheduleHistory(req, res) {
  try {
    const { employeeId } = req.params;
    const { rows } = await quantumPool.query(`
      SELECT ws.*
      FROM working_schedules ws
      WHERE ws.employee_id = $1
      ORDER BY ws.effective_date DESC
    `, [employeeId]);

    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─── CREATE Schedule ──────────────────────────────────────────────────────────

async function createSchedule(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    await client.query('BEGIN');

    const {
      employee_id,
      schedule_name = 'Standard Earth-Sync',
      effective_date,
      shift_pattern = 'Standard-5x8',
      is_active = true,
      notes,
      // Day blocks
      mon_start, mon_end, mon_break_mins = 60,
      tue_start, tue_end, tue_break_mins = 60,
      wed_start, wed_end, wed_break_mins = 60,
      thu_start, thu_end, thu_break_mins = 60,
      fri_start, fri_end, fri_break_mins = 60,
      sat_start, sat_end, sat_break_mins = 0,
      sun_start, sun_end, sun_break_mins = 0,
    } = req.body;

    if (!employee_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'employee_id is required.' });
    }

    // /orbital-schedule-engine: JS-side weekly hours calculation
    const weeklyHours = calculateWeeklyHours(req.body);

    // If making this schedule active, deactivate previous active schedules
    if (is_active) {
      await client.query(`
        UPDATE working_schedules SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND is_active = TRUE
      `, [employee_id]);
    }

    const { rows } = await client.query(`
      INSERT INTO working_schedules (
        employee_id, schedule_name, effective_date, shift_pattern, is_active, notes,
        mon_start, mon_end, mon_break_mins,
        tue_start, tue_end, tue_break_mins,
        wed_start, wed_end, wed_break_mins,
        thu_start, thu_end, thu_break_mins,
        fri_start, fri_end, fri_break_mins,
        sat_start, sat_end, sat_break_mins,
        sun_start, sun_end, sun_break_mins,
        computed_weekly_hours
      ) VALUES (
        $1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28
      ) RETURNING *
    `, [
      parseInt(employee_id, 10),
      schedule_name,
      effective_date || null,
      shift_pattern,
      is_active,
      notes || null,
      mon_start || null, mon_end || null, parseInt(mon_break_mins, 10),
      tue_start || null, tue_end || null, parseInt(tue_break_mins, 10),
      wed_start || null, wed_end || null, parseInt(wed_break_mins, 10),
      thu_start || null, thu_end || null, parseInt(thu_break_mins, 10),
      fri_start || null, fri_end || null, parseInt(fri_break_mins, 10),
      sat_start || null, sat_end || null, parseInt(sat_break_mins, 10),
      sun_start || null, sun_end || null, parseInt(sun_break_mins, 10),
      weeklyHours,
    ]);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: `Orbital schedule "${rows[0].schedule_name}" initialized. Weekly orbit: ${weeklyHours}h.`,
      data: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SCHEDULE] createSchedule error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// ─── UPDATE Schedule ──────────────────────────────────────────────────────────

async function updateSchedule(req, res) {
  const client = await quantumPool.getQuantumClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updates = req.body;

    const existing = await client.query('SELECT * FROM working_schedules WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: `Schedule #${id} not found.` });
    }

    const curr = existing.rows[0];

    // Merge updates with current values for recalculation
    const merged = { ...curr, ...updates };
    const weeklyHours = calculateWeeklyHours(merged);

    // If activating, deactivate other schedules for this employee
    if (updates.is_active === true && !curr.is_active) {
      await client.query(`
        UPDATE working_schedules SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $1 AND is_active = TRUE AND id != $2
      `, [curr.employee_id, id]);
    }

    const { rows } = await client.query(`
      UPDATE working_schedules SET
        schedule_name  = COALESCE($1,  schedule_name),
        effective_date = COALESCE($2,  effective_date),
        shift_pattern  = COALESCE($3,  shift_pattern),
        is_active      = COALESCE($4,  is_active),
        notes          = COALESCE($5,  notes),
        mon_start = $6,  mon_end = $7,  mon_break_mins = $8,
        tue_start = $9,  tue_end = $10, tue_break_mins = $11,
        wed_start = $12, wed_end = $13, wed_break_mins = $14,
        thu_start = $15, thu_end = $16, thu_break_mins = $17,
        fri_start = $18, fri_end = $19, fri_break_mins = $20,
        sat_start = $21, sat_end = $22, sat_break_mins = $23,
        sun_start = $24, sun_end = $25, sun_break_mins = $26,
        computed_weekly_hours = $27,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $28
      RETURNING *
    `, [
      updates.schedule_name || null,
      updates.effective_date || null,
      updates.shift_pattern || null,
      updates.is_active !== undefined ? updates.is_active : null,
      updates.notes !== undefined ? updates.notes : null,
      merged.mon_start || null, merged.mon_end || null, parseInt(merged.mon_break_mins || 60, 10),
      merged.tue_start || null, merged.tue_end || null, parseInt(merged.tue_break_mins || 60, 10),
      merged.wed_start || null, merged.wed_end || null, parseInt(merged.wed_break_mins || 60, 10),
      merged.thu_start || null, merged.thu_end || null, parseInt(merged.thu_break_mins || 60, 10),
      merged.fri_start || null, merged.fri_end || null, parseInt(merged.fri_break_mins || 60, 10),
      merged.sat_start || null, merged.sat_end || null, parseInt(merged.sat_break_mins || 0, 10),
      merged.sun_start || null, merged.sun_end || null, parseInt(merged.sun_break_mins || 0, 10),
      weeklyHours,
      id,
    ]);

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Schedule recalibrated. New weekly orbit: ${weeklyHours}h.`,
      data: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SCHEDULE] updateSchedule error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// ─── DELETE Schedule ──────────────────────────────────────────────────────────

async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;

    const check = await quantumPool.query('SELECT is_active FROM working_schedules WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Schedule #${id} not found.` });
    }
    if (check.rows[0].is_active) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete an active schedule. Deactivate it first.',
      });
    }

    await quantumPool.query('DELETE FROM working_schedules WHERE id = $1', [id]);

    return res.json({ success: true, message: `Schedule #${id} removed from orbital planner.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllSchedules,
  getScheduleById,
  getActiveScheduleForEmployee,
  getEmployeeScheduleHistory,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
