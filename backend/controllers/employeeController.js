// ====================================================================
// Employee Master Management Controller
// Handles full CRUD operations, Kanban status transitions,
// and relational joins for department, manager, schedule, and role.
// ====================================================================

const quantumPool = require('../config/quantumPool');

/**
 * Get all employees with relational joins (department, role, manager)
 */
async function getAllEmployees(req, res) {
  try {
    const { search, department, status, sortBy = 'id', order = 'ASC' } = req.query;

    let queryText = `
      SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        (e.first_name || ' ' || e.last_name) AS full_name,
        e.email,
        e.phone,
        e.avatar_url,
        e.job_position,
        e.schedule,
        e.status,
        e.work_location,
        e.employment_type,
        e.hire_date,
        e.base_salary,
        e.gravity_allowance,
        (e.base_salary + e.gravity_allowance) AS total_compensation,
        e.anti_gravity_rating,
        e.clearance_tier,
        e.emergency_contact,
        e.notes,
        e.created_at,
        e.updated_at,
        -- Department details
        e.department_id,
        d.name AS department_name,
        d.code AS department_code,
        d.orbital_deck,
        -- Role details
        e.role_id,
        r.title AS role_title,
        r.clearance_level AS role_clearance,
        -- Manager details
        e.manager_id,
        (m.first_name || ' ' || m.last_name) AS manager_name,
        m.email AS manager_email,
        m.job_position AS manager_position
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      const pIdx = queryParams.length;
      queryText += ` AND (
        e.first_name ILIKE $${pIdx} OR 
        e.last_name ILIKE $${pIdx} OR 
        e.email ILIKE $${pIdx} OR 
        e.employee_id ILIKE $${pIdx} OR 
        e.job_position ILIKE $${pIdx}
      )`;
    }

    if (department && department !== 'ALL') {
      queryParams.push(department);
      const pIdx = queryParams.length;
      queryText += ` AND (d.code = $${pIdx} OR d.id::text = $${pIdx})`;
    }

    if (status && status !== 'ALL') {
      queryParams.push(status);
      const pIdx = queryParams.length;
      queryText += ` AND e.status = $${pIdx}`;
    }

    // Sort safety check
    const allowedSortFields = ['id', 'first_name', 'last_name', 'job_position', 'base_salary', 'hire_date', 'status'];
    const safeSort = allowedSortFields.includes(sortBy) ? `e.${sortBy}` : 'e.id';
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    queryText += ` ORDER BY ${safeSort} ${safeOrder}`;

    const { rows, thrustLatencyMs } = await quantumPool.query(queryText, queryParams);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
      quantumProfiling: {
        thrustLatencyMs,
        quantumStatus: 'OPTIMAL',
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orbital employee directory',
      details: error.message,
    });
  }
}

/**
 * Get single employee by ID with direct reports
 */
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;

    const queryText = `
      SELECT 
        e.*,
        (e.first_name || ' ' || e.last_name) AS full_name,
        d.name AS department_name,
        d.code AS department_code,
        d.orbital_deck,
        r.title AS role_title,
        r.clearance_level AS role_clearance,
        (m.first_name || ' ' || m.last_name) AS manager_name,
        m.email AS manager_email
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.id = $1 OR e.employee_id = $1
    `;

    const { rows, thrustLatencyMs } = await quantumPool.query(queryText, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Astronaut/Employee with identifier '${id}' not found in registry`,
      });
    }

    const employee = rows[0];

    // Fetch direct reports
    const reportsQuery = `
      SELECT id, employee_id, first_name, last_name, job_position, status, avatar_url
      FROM employees
      WHERE manager_id = $1
    `;
    const reportsResult = await quantumPool.query(reportsQuery, [employee.id]);
    employee.direct_reports = reportsResult.rows;

    return res.json({
      success: true,
      data: employee,
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    console.error('Error fetching employee by id:', error);
    return res.status(500).json({
      success: false,
      error: 'Quantum query failure',
      details: error.message,
    });
  }
}

/**
 * Create new employee
 */
async function createEmployee(req, res) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      avatar_url,
      department_id,
      role_id,
      job_position,
      manager_id,
      schedule = 'Standard Earth-Sync (9AM-5PM)',
      status = 'Onboarding',
      work_location = 'Orbital Station Alpha / Remote',
      employment_type = 'Full-Time Quantum Sync',
      hire_date,
      base_salary = 100000.00,
      gravity_allowance = 12000.00,
      anti_gravity_rating = 'AG-9',
      clearance_tier = 'Level-2 Specialist',
      emergency_contact,
      notes,
    } = req.body;

    if (!first_name || !last_name || !email || !job_position) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing: first_name, last_name, email, job_position are mandatory',
      });
    }

    // Generate unique employee_id if not provided
    let empId = req.body.employee_id;
    if (!empId) {
      const countRes = await quantumPool.query('SELECT COUNT(*) AS total FROM employees');
      const nextNum = parseInt(countRes.rows[0].total, 10) + 1001;
      empId = `PP360-${nextNum}`;
    }

    const insertQuery = `
      INSERT INTO employees (
        employee_id, first_name, last_name, email, phone, avatar_url,
        department_id, role_id, job_position, manager_id, schedule,
        status, work_location, employment_type, hire_date,
        base_salary, gravity_allowance, anti_gravity_rating, clearance_tier,
        emergency_contact, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, COALESCE($15, CURRENT_DATE),
        $16, $17, $18, $19,
        $20, $21
      ) RETURNING *;
    `;

    const values = [
      empId,
      first_name,
      last_name,
      email,
      phone || null,
      avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${empId}`,
      department_id ? parseInt(department_id, 10) : null,
      role_id ? parseInt(role_id, 10) : null,
      job_position,
      manager_id ? parseInt(manager_id, 10) : null,
      schedule,
      status,
      work_location,
      employment_type,
      hire_date || null,
      parseFloat(base_salary) || 100000.00,
      parseFloat(gravity_allowance) || 12000.00,
      anti_gravity_rating,
      clearance_tier,
      emergency_contact || null,
      notes || null,
    ];

    const { rows, thrustLatencyMs } = await quantumPool.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: `Astronaut ${first_name} ${last_name} enrolled successfully into PeoplePay360`,
      data: rows[0],
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'An employee with this email or Employee ID already exists.',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to create employee record',
      details: error.message,
    });
  }
}

/**
 * Update existing employee
 */
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check existing
    const existingRes = await quantumPool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Employee record #${id} not found`,
      });
    }

    const current = existingRes.rows[0];

    const updateQuery = `
      UPDATE employees SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        avatar_url = COALESCE($5, avatar_url),
        department_id = COALESCE($6, department_id),
        role_id = COALESCE($7, role_id),
        job_position = COALESCE($8, job_position),
        manager_id = $9,
        schedule = COALESCE($10, schedule),
        status = COALESCE($11, status),
        work_location = COALESCE($12, work_location),
        employment_type = COALESCE($13, employment_type),
        base_salary = COALESCE($14, base_salary),
        gravity_allowance = COALESCE($15, gravity_allowance),
        anti_gravity_rating = COALESCE($16, anti_gravity_rating),
        clearance_tier = COALESCE($17, clearance_tier),
        emergency_contact = COALESCE($18, emergency_contact),
        notes = COALESCE($19, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *;
    `;

    const values = [
      updates.first_name || null,
      updates.last_name || null,
      updates.email || null,
      updates.phone !== undefined ? updates.phone : null,
      updates.avatar_url || null,
      updates.department_id ? parseInt(updates.department_id, 10) : null,
      updates.role_id ? parseInt(updates.role_id, 10) : null,
      updates.job_position || null,
      updates.manager_id !== undefined ? (updates.manager_id ? parseInt(updates.manager_id, 10) : null) : current.manager_id,
      updates.schedule || null,
      updates.status || null,
      updates.work_location || null,
      updates.employment_type || null,
      updates.base_salary ? parseFloat(updates.base_salary) : null,
      updates.gravity_allowance ? parseFloat(updates.gravity_allowance) : null,
      updates.anti_gravity_rating || null,
      updates.clearance_tier || null,
      updates.emergency_contact !== undefined ? updates.emergency_contact : null,
      updates.notes !== undefined ? updates.notes : null,
      id,
    ];

    const { rows, thrustLatencyMs } = await quantumPool.query(updateQuery, values);

    return res.json({
      success: true,
      message: 'Employee record successfully recalibrated',
      data: rows[0],
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update employee',
      details: error.message,
    });
  }
}

/**
 * Fast status transition (specifically optimized for zero-gravity Kanban drag-and-drop)
 */
async function updateEmployeeStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Active', 'Onboarding', 'On-Leave', 'Suspended', 'Offboarding'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const { rows, thrustLatencyMs } = await quantumPool.query(
      `UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    return res.json({
      success: true,
      message: `Employee orbital status transitioned to ${status}`,
      data: rows[0],
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Delete employee
 */
async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;

    // Check if managing others
    const subRes = await quantumPool.query('SELECT COUNT(*) FROM employees WHERE manager_id = $1', [id]);
    if (parseInt(subRes.rows[0].count, 10) > 0) {
      // Reassign or clear manager first
      await quantumPool.query('UPDATE employees SET manager_id = NULL WHERE manager_id = $1', [id]);
    }

    const { rows, thrustLatencyMs } = await quantumPool.query(
      'DELETE FROM employees WHERE id = $1 RETURNING id, employee_id, first_name, last_name',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    return res.json({
      success: true,
      message: `Employee ${rows[0].first_name} ${rows[0].last_name} (${rows[0].employee_id}) disengaged from system`,
      deleted: rows[0],
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Aggregated statistics for dashboard & Kanban
 */
async function getEmployeeStats(req, res) {
  try {
    const statusCounts = await quantumPool.query(`
      SELECT status, COUNT(*) AS count
      FROM employees
      GROUP BY status
    `);

    const deptCounts = await quantumPool.query(`
      SELECT d.name, d.code, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id, d.name, d.code
      ORDER BY employee_count DESC
    `);

    const totals = await quantumPool.query(`
      SELECT 
        COUNT(*) AS total_employees,
        COALESCE(SUM(base_salary), 0) AS total_base_payroll,
        COALESCE(SUM(gravity_allowance), 0) AS total_gravity_allowances,
        COALESCE(AVG(base_salary), 0) AS avg_salary
      FROM employees
    `);

    return res.json({
      success: true,
      data: {
        totals: totals.rows[0],
        byStatus: statusCounts.rows,
        byDepartment: deptCounts.rows,
      },
    });
  } catch (error) {
    console.error('Error getting employee stats:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  getEmployeeStats,
};
