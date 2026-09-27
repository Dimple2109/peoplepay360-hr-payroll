-- ====================================================================
-- PeoplePay360: Anti-Gravity HR & Payroll Platform
-- Database Schema (PostgreSQL)
-- Core tables: departments, roles, employees, propulsion_telemetry_logs
-- ====================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    head_count_target INTEGER DEFAULT 25,
    budget_allocation NUMERIC(14, 2) DEFAULT 750000.00,
    orbital_deck VARCHAR(80) DEFAULT 'Deck 04 - Gravitational Hub',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    title VARCHAR(120) NOT NULL,
    clearance_level VARCHAR(40) DEFAULT 'Level-2 Specialist',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    salary_min NUMERIC(12, 2) DEFAULT 70000.00,
    salary_max NUMERIC(12, 2) DEFAULT 190000.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(40),
    avatar_url TEXT,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    job_position VARCHAR(120) NOT NULL,
    manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    schedule VARCHAR(80) DEFAULT 'Standard Earth-Sync (9AM-5PM)',
    status VARCHAR(40) DEFAULT 'Active', -- 'Active', 'Onboarding', 'On-Leave', 'Suspended', 'Offboarding'
    work_location VARCHAR(80) DEFAULT 'Orbital Station Alpha / Remote',
    employment_type VARCHAR(40) DEFAULT 'Full-Time Quantum Sync',
    hire_date DATE DEFAULT CURRENT_DATE,
    base_salary NUMERIC(12, 2) DEFAULT 120000.00,
    gravity_allowance NUMERIC(12, 2) DEFAULT 15000.00,
    anti_gravity_rating VARCHAR(20) DEFAULT 'AG-9',
    clearance_tier VARCHAR(40) DEFAULT 'Level-2 Specialist',
    emergency_contact VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Propulsion Telemetry Logs (for /propulsion-logging)
CREATE TABLE IF NOT EXISTS propulsion_telemetry_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(60) NOT NULL,
    route VARCHAR(255),
    method VARCHAR(15),
    status_code INTEGER,
    execution_time_ms NUMERIC(8, 2),
    quantum_pool_active INTEGER,
    quantum_pool_idle INTEGER,
    thrust_score NUMERIC(5, 2),
    client_ip VARCHAR(60),
    user_clearance VARCHAR(50),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quantum Indexing for Ultra-Fast Retrieval
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_roles_dept ON roles(department_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON propulsion_telemetry_logs(created_at DESC);
