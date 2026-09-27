const fs = require('fs');
const path = require('path');
const quantumPool = require('../config/quantumPool');

async function migrate() {
  console.log('[QUANTUM-MIGRATE] Initializing orbital schema & seed on PostgreSQL...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    const contractsSchemaSql = fs.readFileSync(path.join(__dirname, 'contracts_schema.sql'), 'utf8');
    const attendanceSchemaSql = fs.readFileSync(path.join(__dirname, 'attendance_timeoff_schema.sql'), 'utf8');
    const attendanceSeedSql = fs.readFileSync(path.join(__dirname, 'attendance_timeoff_seed.sql'), 'utf8');
    const salarySchemaSql = fs.readFileSync(path.join(__dirname, 'salary_schema.sql'), 'utf8');

    console.log('[QUANTUM-MIGRATE] Step 1: Applying core schema definitions...');
    await quantumPool.query(schemaSql);

    console.log('[QUANTUM-MIGRATE] Step 2: Seeding initial astronaut master registry...');
    await quantumPool.query(seedSql);

    console.log('[QUANTUM-MIGRATE] Step 3: Applying contracts & working schedules schema...');
    await quantumPool.query(contractsSchemaSql);

    console.log('[QUANTUM-MIGRATE] Step 4: Seeding baseline contracts & schedules...');
    await quantumPool.query(`
      INSERT INTO contracts (employee_id, start_date, end_date, base_salary, gravity_allowance, salary_structure, status)
      SELECT id, '2025-01-01', NULL, base_salary, gravity_allowance, 'Standard Quantum Compensation', 'active'
      FROM employees
      ON CONFLICT DO NOTHING;

      INSERT INTO working_schedules (employee_id, schedule_name, effective_date, mon_start, mon_end, tue_start, tue_end, wed_start, wed_end, thu_start, thu_end, fri_start, fri_end, shift_pattern, is_active)
      SELECT id, schedule, '2025-01-01', '09:00', '17:00', '09:00', '17:00', '09:00', '17:00', '09:00', '17:00', '09:00', '17:00', 'Standard-5x8', true
      FROM employees
      ON CONFLICT DO NOTHING;
    `);

    console.log('[QUANTUM-MIGRATE] Step 5: Applying attendance & time off schema...');
    await quantumPool.query(attendanceSchemaSql);

    console.log('[QUANTUM-MIGRATE] Step 6: Seeding attendance logs, time-off allocations & requests...');
    await quantumPool.query(attendanceSeedSql);

    console.log('[QUANTUM-MIGRATE] Step 7: Applying /quantum-salary-structuring, /gravitational-rule-engine & /warp-computation-matrix schema and seeds...');
    await quantumPool.query(salarySchemaSql);

    console.log('[QUANTUM-MIGRATE] Quantum migration completed with 100% nominal thrust.');
    process.exit(0);
  } catch (error) {
    console.error('[QUANTUM-MIGRATE] Migration failure:', error);
    process.exit(1);
  }
}

migrate();
