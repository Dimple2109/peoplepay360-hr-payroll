-- ====================================================================
-- PeoplePay360: Anti-Gravity HR & Payroll Platform
-- /quantum-salary-structuring — Containerized Salary Structures & Rule Mapping
-- /gravitational-rule-engine  — Ordered Rule Execution (Basic -> Allowance -> Gross -> Deduction -> Net)
-- /warp-computation-matrix    — Fixed, Percentage & Custom Space Formulas
-- Schema Extension: salary_structures + salary_rules
-- ====================================================================

-- -------------------------------------------------------------------
-- 1. SALARY_STRUCTURES TABLE (/quantum-salary-structuring)
--    Holds salary structure containers, active status, wage type,
--    and metadata linking crew compensation profiles.
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_structures (
    id SERIAL PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    wage_type VARCHAR(20) NOT NULL DEFAULT 'monthly'
        CHECK (wage_type IN ('monthly', 'hourly', 'mission')),
    company_contribution NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    version INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_structures_code ON salary_structures(code);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON salary_structures(is_active);

-- -------------------------------------------------------------------
-- 2. SALARY_RULES TABLE (/gravitational-rule-engine & /warp-computation-matrix)
--    Defines individual compensation rules evaluated in strict sequence.
--    Categories: basic, allowance, gross, deduction, net
--    Computation types: fixed, percentage, formula
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_rules (
    id SERIAL PRIMARY KEY,
    salary_structure_id INTEGER NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(60) NOT NULL,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('basic', 'allowance', 'gross', 'deduction', 'net')),
    sequence INTEGER NOT NULL DEFAULT 10,
    computation_type VARCHAR(30) NOT NULL DEFAULT 'fixed'
        CHECK (computation_type IN ('fixed', 'percentage', 'formula')),
    amount NUMERIC(14, 2) DEFAULT 0.00,
    percentage NUMERIC(6, 2) DEFAULT 0.00,
    formula TEXT,
    base_rule_id INTEGER REFERENCES salary_rules(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_structure_rule_code UNIQUE (salary_structure_id, code)
);

-- Performance & Sequencing Indexes
CREATE INDEX IF NOT EXISTS idx_salary_rules_structure_seq ON salary_rules(salary_structure_id, sequence);
CREATE INDEX IF NOT EXISTS idx_salary_rules_category ON salary_rules(category);
CREATE INDEX IF NOT EXISTS idx_salary_rules_active ON salary_rules(is_active);

-- -------------------------------------------------------------------
-- VIEW: salary_structure_summary
-- Aggregates total rules, basic rules, allowances, deductions, and active crew count
-- -------------------------------------------------------------------
CREATE OR REPLACE VIEW v_salary_structure_summary AS
SELECT 
    s.id,
    s.code,
    s.name,
    s.description,
    s.wage_type,
    s.company_contribution,
    s.is_active,
    s.currency,
    s.version,
    s.created_at,
    s.updated_at,
    COUNT(r.id)::INTEGER AS total_rules,
    COUNT(CASE WHEN r.category = 'basic' THEN 1 END)::INTEGER AS basic_rule_count,
    COUNT(CASE WHEN r.category = 'allowance' THEN 1 END)::INTEGER AS allowance_rule_count,
    COUNT(CASE WHEN r.category = 'deduction' THEN 1 END)::INTEGER AS deduction_rule_count,
    COALESCE(emp_counts.assigned_employees, 0)::INTEGER AS assigned_employees
FROM salary_structures s
LEFT JOIN salary_rules r ON r.salary_structure_id = s.id AND r.is_active = TRUE
LEFT JOIN (
    SELECT salary_structure, COUNT(DISTINCT employee_id) AS assigned_employees
    FROM contracts
    WHERE status = 'active'
    GROUP BY salary_structure
) emp_counts ON emp_counts.salary_structure = s.name OR emp_counts.salary_structure = s.code
GROUP BY s.id, emp_counts.assigned_employees;

-- -------------------------------------------------------------------
-- SEED DATA: Orbital Salary Structures & Rules
-- -------------------------------------------------------------------

-- 1. Regular Orbital Salary
INSERT INTO salary_structures (code, name, description, wage_type, company_contribution, is_active, currency, version)
VALUES 
(
    'STRUCT-ORB-REG',
    'Regular Orbital Salary',
    'Standard anti-gravity compensation container for orbital station crew and mission personnel. Calibrated for standard Earth-sync schedules and gravity allowances.',
    'monthly',
    850.00,
    TRUE,
    'USD',
    1
)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

-- Rules for Regular Orbital Salary
WITH s AS (SELECT id FROM salary_structures WHERE code = 'STRUCT-ORB-REG')
INSERT INTO salary_rules (salary_structure_id, name, code, category, sequence, computation_type, amount, percentage, formula, is_active, notes)
SELECT s.id, r.name, r.code, r.category, r.sequence, r.computation_type, r.amount, r.percentage, r.formula, r.is_active, r.notes
FROM s, (VALUES
    ('Base Orbital Salary', 'BASIC', 'basic', 10, 'percentage', 0.00, 100.00, 'base_salary / 12', true, 'Full monthly base contract salary'),
    ('Gravitational Dispersion Allowance', 'GRAV_ALLOW', 'allowance', 20, 'fixed', 1000.00, 0.00, NULL, true, 'Zero-G bone density and muscle preservation allowance'),
    ('Orbital Hazard Differential', 'ORB_HAZARD', 'allowance', 30, 'percentage', 0.00, 12.00, 'BASIC * 0.12', true, '12% hazard compensation on basic orbital salary'),
    ('Cosmic Radiation Protection Subsidy', 'RADIATION_SUBSIDY', 'allowance', 40, 'fixed', 450.00, 0.00, NULL, true, 'Radiation shield and medical nanite monitoring stipend'),
    ('Gross Orbital Compensation', 'GROSS', 'gross', 100, 'formula', 0.00, 0.00, 'BASIC + GRAV_ALLOW + ORB_HAZARD + RADIATION_SUBSIDY', true, 'Computed gross orbital earnings before deductions'),
    ('Galactic Provident & Pension Fund', 'ORB_PENSION', 'deduction', 110, 'percentage', 0.00, 8.00, 'GROSS * 0.08', true, '8% statutory Galactic Retirement withholding'),
    ('Orbital Station Habitat Withholding Tax', 'STATION_TAX', 'deduction', 120, 'formula', 0.00, 0.00, 'GROSS * 0.15', true, '15% habitat infrastructure maintenance withholding'),
    ('Spacewalk & EVA Liability Insurance', 'EVA_INSURANCE', 'deduction', 130, 'fixed', 350.00, 0.00, NULL, true, 'Standard extravehicular activity liability coverage'),
    ('Net Quantum Disbursable Payout', 'NET', 'net', 200, 'formula', 0.00, 0.00, 'GROSS - (ORB_PENSION + STATION_TAX + EVA_INSURANCE)', true, 'Final net credited payout transferred to crew wallet')
) AS r(name, code, category, sequence, computation_type, amount, percentage, formula, is_active, notes)
ON CONFLICT (salary_structure_id, code) DO NOTHING;

-- 2. Executive Warp-Tier
INSERT INTO salary_structures (code, name, description, wage_type, company_contribution, is_active, currency, version)
VALUES 
(
    'STRUCT-WARP-EXEC',
    'Executive Warp-Tier',
    'High-clearance warp trajectory package for Fleet Admirals and Chief Engineers, featuring gravity scaling, warp propulsion incentives, and command quarters subsidies.',
    'monthly',
    1800.00,
    TRUE,
    'USD',
    1
)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

-- Rules for Executive Warp-Tier
WITH s AS (SELECT id FROM salary_structures WHERE code = 'STRUCT-WARP-EXEC')
INSERT INTO salary_rules (salary_structure_id, name, code, category, sequence, computation_type, amount, percentage, formula, is_active, notes)
SELECT s.id, r.name, r.code, r.category, r.sequence, r.computation_type, r.amount, r.percentage, r.formula, r.is_active, r.notes
FROM s, (VALUES
    ('Executive Base Salary', 'EXEC_BASIC', 'basic', 10, 'fixed', 16500.00, 0.00, NULL, true, 'Command deck tier baseline monthly salary'),
    ('Warp Velocity Propulsion Incentive', 'WARP_PROPULSION', 'allowance', 20, 'percentage', 0.00, 25.00, 'EXEC_BASIC * 0.25', true, '25% warp synchronization incentive'),
    ('Command Deck Quarters & Life Support', 'ADMIRAL_QUARTERS', 'allowance', 30, 'fixed', 3200.00, 0.00, NULL, true, 'Dedicated habitat suite with isolated life support'),
    ('Gross Warp Compensation', 'GROSS', 'gross', 100, 'formula', 0.00, 0.00, 'EXEC_BASIC + WARP_PROPULSION + ADMIRAL_QUARTERS', true, 'Total gross executive compensation'),
    ('Interplanetary High-Bracket Income Tax', 'DEEP_SPACE_TAX', 'deduction', 110, 'formula', 0.00, 0.00, 'GROSS * 0.22', true, '22% interplanetary high bracket tax'),
    ('Superconducting Energy Core Reserve', 'QUANTUM_RESERVE', 'deduction', 120, 'percentage', 0.00, 5.00, 'GROSS * 0.05', true, '5% fleet defense and energy escrow'),
    ('Net Executive Disbursable', 'NET', 'net', 200, 'formula', 0.00, 0.00, 'GROSS - (DEEP_SPACE_TAX + QUANTUM_RESERVE)', true, 'Final net executive disbursal')
) AS r(name, code, category, sequence, computation_type, amount, percentage, formula, is_active, notes)
ON CONFLICT (salary_structure_id, code) DO NOTHING;

-- 3. Deep Space Mission Contractor
INSERT INTO salary_structures (code, name, description, wage_type, company_contribution, is_active, currency, version)
VALUES 
(
    'STRUCT-DS-MIS',
    'Deep Space Mission Pay',
    'Mission-contingent payload computation with cryogenic standby allowances, radiation differentials, and thruster equipment deductions.',
    'monthly',
    500.00,
    TRUE,
    'USD',
    1
)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

-- Rules for Deep Space Mission Contractor
WITH s AS (SELECT id FROM salary_structures WHERE code = 'STRUCT-DS-MIS')
INSERT INTO salary_rules (salary_structure_id, name, code, category, sequence, computation_type, amount, percentage, formula, is_active, notes)
SELECT s.id, r.name, r.code, r.category, r.sequence, r.computation_type, r.amount, r.percentage, r.formula, r.is_active, r.notes
FROM s, (VALUES
    ('Mission Baseline Pay', 'MISSION_BASE', 'basic', 10, 'fixed', 7500.00, 0.00, NULL, true, 'Base mission stipend for duration of assignment'),
    ('Cryogenic Stasis Standby Allowance', 'CRYO_STANDBY', 'allowance', 20, 'percentage', 0.00, 18.00, 'MISSION_BASE * 0.18', true, '18% hazard allowance during deep stasis phases'),
    ('Orbital Telemetry Differential', 'TELEMETRY_DIFF', 'allowance', 30, 'fixed', 800.00, 0.00, NULL, true, 'Real-time telemetry uplink shift allowance'),
    ('Gross Mission Pay', 'GROSS', 'gross', 100, 'formula', 0.00, 0.00, 'MISSION_BASE + CRYO_STANDBY + TELEMETRY_DIFF', true, 'Total mission gross earnings'),
    ('Thruster Suit Wear & Tear Depreciation', 'EQUIP_DEPREC', 'deduction', 110, 'fixed', 320.00, 0.00, NULL, true, 'Personal propulsion gear inspection and servicing fee'),
    ('Contractor Withholding Levy', 'CONTRACTOR_LEVY', 'deduction', 120, 'percentage', 0.00, 10.00, 'GROSS * 0.10', true, '10% contractor mission withholding'),
    ('Net Mission Disbursal', 'NET', 'net', 200, 'formula', 0.00, 0.00, 'GROSS - (EQUIP_DEPREC + CONTRACTOR_LEVY)', true, 'Net payout transferred upon mission milestone signoff')
) AS r(name, code, category, sequence, computation_type, amount, percentage, formula, is_active, notes)
ON CONFLICT (salary_structure_id, code) DO NOTHING;
