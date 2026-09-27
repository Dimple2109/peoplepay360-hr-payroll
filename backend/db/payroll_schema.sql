-- ====================================================================
-- PeoplePay360: Anti-Gravity HR & Payroll Platform
-- /orbital-payrun-wizard   — Two-step pay run creation & batching
-- /quantum-payslip-engine  — Automated salary computation & contract syncing
-- /teleport-pdf-disbursal  — Printable PDF payslips & bulk email transmission
-- /stellar-payroll-dashboard — KPI metrics, monthly trends, & health alerts
-- Schema Extension: payruns & payslips
-- ====================================================================

-- ---------------------------------------------------------------
-- 1. PAYRUNS TABLE (/orbital-payrun-wizard)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payruns (
    id SERIAL PRIMARY KEY,
    run_name VARCHAR(140) NOT NULL,
    run_code VARCHAR(60) UNIQUE NOT NULL,
    salary_structure VARCHAR(80) NOT NULL DEFAULT 'Standard Quantum Compensation',
    
    -- Pay Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Processing State Machine: Draft -> Computed -> Validated -> Paid
    status VARCHAR(30) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Computed', 'Validated', 'Paid')),
        
    -- Financial Aggregates
    total_employees INTEGER DEFAULT 0,
    total_gross NUMERIC(14, 2) DEFAULT 0.00,
    total_allowances NUMERIC(14, 2) DEFAULT 0.00,
    total_deductions NUMERIC(14, 2) DEFAULT 0.00,
    total_net NUMERIC(14, 2) DEFAULT 0.00,
    
    -- Validation & Sign-off Telemetry
    validated_by VARCHAR(100),
    validated_at TIMESTAMPTZ,
    paid_by VARCHAR(100),
    paid_at TIMESTAMPTZ,
    
    -- Email Teleport Telemetry
    emails_dispatched_at TIMESTAMPTZ,
    emails_sent_count INTEGER DEFAULT 0,
    
    -- Validation Warnings (/gravity-exception-detector alerts)
    validation_warnings JSONB DEFAULT '[]'::jsonb,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payruns_status ON payruns(status);
CREATE INDEX IF NOT EXISTS idx_payruns_dates ON payruns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payruns_code ON payruns(run_code);

-- Trigger: Generate payrun code
CREATE OR REPLACE FUNCTION fn_generate_payrun_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.run_code IS NULL OR NEW.run_code = '' THEN
        NEW.run_code := 'PR-' || TO_CHAR(NEW.start_date, 'YYYYMM') || '-' || LPAD(COALESCE(NEW.id, (SELECT COALESCE(MAX(id),0)+1 FROM payruns))::TEXT, 3, '0');
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_payrun_code ON payruns;
CREATE TRIGGER trg_generate_payrun_code
    BEFORE INSERT OR UPDATE ON payruns
    FOR EACH ROW EXECUTE FUNCTION fn_generate_payrun_code();


-- ---------------------------------------------------------------
-- 2. PAYSLIPS TABLE (/quantum-payslip-engine & /teleport-pdf-disbursal)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    slip_number VARCHAR(60) UNIQUE NOT NULL,
    payrun_id INTEGER NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    
    -- Worked Days & Shift Hours
    worked_days NUMERIC(5, 1) DEFAULT 22.0,
    total_hours NUMERIC(6, 2) DEFAULT 176.00,
    
    -- Earnings Components
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gravity_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    propulsion_bonus NUMERIC(12, 2) DEFAULT 0.00,
    hazard_allowance NUMERIC(12, 2) DEFAULT 0.00,
    
    -- Deductions Components
    quantum_tax NUMERIC(12, 2) DEFAULT 0.00,
    medical_decompression_fund NUMERIC(12, 2) DEFAULT 0.00,
    planetary_pension NUMERIC(12, 2) DEFAULT 0.00,
    
    -- Calculated Summaries
    total_allowances NUMERIC(12, 2) DEFAULT 0.00,
    total_deductions NUMERIC(12, 2) DEFAULT 0.00,
    gross_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Distribution Telemetry: Generated -> Sent -> Paid
    status VARCHAR(30) DEFAULT 'Generated'
        CHECK (status IN ('Draft', 'Generated', 'Sent', 'Paid')),
    sent_at TIMESTAMPTZ,
    sent_to VARCHAR(150),
    
    -- /quantum-payslip-engine Computation Trace & Formula Audit
    computation_trace JSONB,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_payrun_employee UNIQUE (payrun_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

-- Trigger: Generate slip number
CREATE OR REPLACE FUNCTION fn_generate_slip_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slip_number IS NULL OR NEW.slip_number = '' THEN
        NEW.slip_number := 'PSL-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMM') || '-' || LPAD(COALESCE(NEW.id, (SELECT COALESCE(MAX(id),0)+1 FROM payslips))::TEXT, 5, '0');
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_slip_number ON payslips;
CREATE TRIGGER trg_generate_slip_number
    BEFORE INSERT OR UPDATE ON payslips
    FOR EACH ROW EXECUTE FUNCTION fn_generate_slip_number();
