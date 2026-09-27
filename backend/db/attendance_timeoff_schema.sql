-- ====================================================================
-- PeoplePay360: Anti-Gravity HR & Payroll Platform
-- /orbital-attendance-sync   — Real-time check-in/out & worked hours
-- /zero-g-timeoff-allocator  — Automated approvals & balance deductions
-- /gravity-exception-detector — Missing check-outs & late arrivals
-- Schema Extension: attendance_logs, time_off_types, time_off_allocations, time_off_requests
-- ====================================================================

-- ---------------------------------------------------------------
-- 1. ATTENDANCE_LOGS TABLE (/orbital-attendance-sync & /gravity-exception-detector)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    worked_hours NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Present'
        CHECK (status IN ('Present', 'Late', 'Absent', 'Overtime', 'Half-Day', 'On-Leave')),
    
    -- /gravity-exception-detector & Manual corrections
    is_manual_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    override_by VARCHAR(100),
    is_exception BOOLEAN DEFAULT FALSE,
    exception_type VARCHAR(60), -- 'MISSING_CHECKOUT', 'LATE_ENTRY', 'MANUAL_EDIT', 'EXCESSIVE_OVERTIME'
    exception_notes TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance_logs(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_logs(status);
CREATE INDEX IF NOT EXISTS idx_attendance_exception ON attendance_logs(is_exception);

-- Trigger: Automatically compute worked_hours when check_in and check_out are both set
CREATE OR REPLACE FUNCTION fn_compute_worked_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        NEW.worked_hours := ROUND(GREATEST(0, EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0)::NUMERIC, 2);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_worked_hours ON attendance_logs;
CREATE TRIGGER trg_compute_worked_hours
    BEFORE INSERT OR UPDATE ON attendance_logs
    FOR EACH ROW EXECUTE FUNCTION fn_compute_worked_hours();


-- ---------------------------------------------------------------
-- 2. TIME_OFF_TYPES TABLE (Leave policies)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_off_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_days_per_year NUMERIC(5, 1) DEFAULT 20.0,
    color_hex VARCHAR(20) DEFAULT '#00f0ff',
    requires_approval BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------
-- 3. TIME_OFF_ALLOCATIONS TABLE (/zero-g-timeoff-allocator)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_off_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL DEFAULT 2026,
    total_days NUMERIC(5, 1) NOT NULL DEFAULT 20.0,
    used_days NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    remaining_days NUMERIC(5, 1) NOT NULL DEFAULT 20.0,
    valid_from DATE NOT NULL DEFAULT '2026-01-01',
    valid_to DATE NOT NULL DEFAULT '2026-12-31',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_emp_type_year UNIQUE (employee_id, time_off_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_allocations_emp ON time_off_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_allocations_year ON time_off_allocations(year);

-- Trigger: Ensure remaining_days stays synchronized
CREATE OR REPLACE FUNCTION fn_sync_allocation_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_days := GREATEST(0, NEW.total_days - NEW.used_days);
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_allocation_balance ON time_off_allocations;
CREATE TRIGGER trg_sync_allocation_balance
    BEFORE INSERT OR UPDATE ON time_off_allocations
    FOR EACH ROW EXECUTE FUNCTION fn_sync_allocation_balance();


-- ---------------------------------------------------------------
-- 4. TIME_OFF_REQUESTS TABLE (Approval & refusal workflow)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_off_requests (
    id SERIAL PRIMARY KEY,
    request_ref VARCHAR(60) UNIQUE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days NUMERIC(5, 1) NOT NULL DEFAULT 1.0,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Approved', 'Refused', 'Cancelled')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_emp ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_dates ON time_off_requests(start_date, end_date);

-- Trigger: Generate unique request reference number
CREATE OR REPLACE FUNCTION fn_generate_time_off_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_ref IS NULL OR NEW.request_ref = '' THEN
        NEW.request_ref := 'TOR-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMM') || '-' || LPAD(COALESCE(NEW.id, (SELECT COALESCE(MAX(id),0)+1 FROM time_off_requests))::TEXT, 4, '0');
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_time_off_ref ON time_off_requests;
CREATE TRIGGER trg_time_off_ref
    BEFORE INSERT OR UPDATE ON time_off_requests
    FOR EACH ROW EXECUTE FUNCTION fn_generate_time_off_ref();
