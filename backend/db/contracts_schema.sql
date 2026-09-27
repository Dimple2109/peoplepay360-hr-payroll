-- ====================================================================
-- PeoplePay360: Anti-Gravity HR & Payroll Platform
-- /temporal-contract-sync  — Period-Based Contract Versioning
-- /orbital-schedule-engine — Automated Weekly Hours & Shift Patterns
-- /gravitational-wage-tier — Base Salary & Gravity Allowance Validation
-- Schema Extension: contracts + working_schedules
-- ====================================================================

-- ---------------------------------------------------------------
-- 5. CONTRACTS TABLE  (/temporal-contract-sync)
--    Tracks all compensation agreements across time, preventing
--    concurrent active contracts per employee via partial unique index.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    -- Temporal syncing
    start_date DATE NOT NULL,
    end_date   DATE,                             -- NULL = open-ended / perpetual

    -- /gravitational-wage-tier fields
    base_salary       NUMERIC(14, 2) NOT NULL DEFAULT 100000.00,
    gravity_allowance NUMERIC(14, 2) NOT NULL DEFAULT 12000.00,
    salary_structure  VARCHAR(80)    NOT NULL DEFAULT 'Standard Quantum Compensation',
    currency          VARCHAR(10)    NOT NULL DEFAULT 'USD',

    -- Contract identity
    contract_type VARCHAR(60) NOT NULL DEFAULT 'Full-Time Quantum Sync',
    contract_ref  VARCHAR(60) UNIQUE,           -- auto-generated reference code

    -- /temporal-contract-sync status gating
    -- 'active'     → valid for current payroll engine
    -- 'historical' → expired / superseded
    -- 'draft'      → pending activation
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('active', 'historical', 'draft')),

    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- /temporal-contract-sync: ONE active contract max per employee at any time.
-- Partial unique index — only fires when status = 'active'.
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_one_active_per_employee
    ON contracts (employee_id)
    WHERE (status = 'active');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_contracts_employee ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status   ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates    ON contracts(start_date, end_date);

-- ---------------------------------------------------------------
-- 6. WORKING_SCHEDULES TABLE  (/orbital-schedule-engine)
--    Defines weekly shift patterns with per-day time blocks and
--    automated weekly hours calculation stored via trigger.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS working_schedules (
    id SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    schedule_name VARCHAR(120) NOT NULL DEFAULT 'Standard Earth-Sync',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Per-day shift definitions (NULL = day off / non-working)
    mon_start TIME, mon_end TIME, mon_break_mins INTEGER DEFAULT 60,
    tue_start TIME, tue_end TIME, tue_break_mins INTEGER DEFAULT 60,
    wed_start TIME, wed_end TIME, wed_break_mins INTEGER DEFAULT 60,
    thu_start TIME, thu_end TIME, thu_break_mins INTEGER DEFAULT 60,
    fri_start TIME, fri_end TIME, fri_break_mins INTEGER DEFAULT 60,
    sat_start TIME, sat_end TIME, sat_break_mins INTEGER DEFAULT 0,
    sun_start TIME, sun_end TIME, sun_break_mins INTEGER DEFAULT 0,

    -- /orbital-schedule-engine: computed weekly hours (set by trigger)
    computed_weekly_hours NUMERIC(5, 2) DEFAULT 0,

    shift_pattern VARCHAR(60) DEFAULT 'Standard-5x8',
    is_active     BOOLEAN     DEFAULT TRUE,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedules_employee ON working_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active   ON working_schedules(is_active);

-- ---------------------------------------------------------------
-- TRIGGER: Auto-compute weekly hours on insert / update
-- /orbital-schedule-engine: Automated weekly hours calculation
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_weekly_hours()
RETURNS TRIGGER AS $$
DECLARE
    total_mins NUMERIC := 0;
BEGIN
    IF NEW.mon_start IS NOT NULL AND NEW.mon_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.mon_end - NEW.mon_start)) / 60.0 - COALESCE(NEW.mon_break_mins, 0));
    END IF;
    IF NEW.tue_start IS NOT NULL AND NEW.tue_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.tue_end - NEW.tue_start)) / 60.0 - COALESCE(NEW.tue_break_mins, 0));
    END IF;
    IF NEW.wed_start IS NOT NULL AND NEW.wed_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.wed_end - NEW.wed_start)) / 60.0 - COALESCE(NEW.wed_break_mins, 0));
    END IF;
    IF NEW.thu_start IS NOT NULL AND NEW.thu_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.thu_end - NEW.thu_start)) / 60.0 - COALESCE(NEW.thu_break_mins, 0));
    END IF;
    IF NEW.fri_start IS NOT NULL AND NEW.fri_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.fri_end - NEW.fri_start)) / 60.0 - COALESCE(NEW.fri_break_mins, 0));
    END IF;
    IF NEW.sat_start IS NOT NULL AND NEW.sat_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.sat_end - NEW.sat_start)) / 60.0 - COALESCE(NEW.sat_break_mins, 0));
    END IF;
    IF NEW.sun_start IS NOT NULL AND NEW.sun_end IS NOT NULL THEN
        total_mins := total_mins + GREATEST(0, EXTRACT(EPOCH FROM (NEW.sun_end - NEW.sun_start)) / 60.0 - COALESCE(NEW.sun_break_mins, 0));
    END IF;

    NEW.computed_weekly_hours := ROUND((total_mins / 60.0)::NUMERIC, 2);
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_weekly_hours ON working_schedules;
CREATE TRIGGER trg_calculate_weekly_hours
    BEFORE INSERT OR UPDATE ON working_schedules
    FOR EACH ROW EXECUTE FUNCTION fn_calculate_weekly_hours();

-- ---------------------------------------------------------------
-- TRIGGER: Auto-generate contract reference code
-- /temporal-contract-sync: Unique contract identifier generation
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generate_contract_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_ref IS NULL OR NEW.contract_ref = '' THEN
        NEW.contract_ref := 'CTR-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 5, '0');
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contract_ref ON contracts;
CREATE TRIGGER trg_contract_ref
    BEFORE INSERT OR UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION fn_generate_contract_ref();
