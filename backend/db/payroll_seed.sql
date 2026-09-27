-- ====================================================================
-- PeoplePay360: Anti-Gravity Payroll & Payslips Seed Data
-- ====================================================================

-- 1. Insert Payruns (July, August, September 2026)
INSERT INTO payruns (id, run_name, run_code, salary_structure, start_date, end_date, payment_date, status, total_employees, total_gross, total_allowances, total_deductions, total_net, validated_by, validated_at, paid_by, paid_at, emails_sent_count, notes) VALUES
(1, 'July 2026 Flight Crew Cycle', 'PR-202607-001', 'Standard Quantum Compensation', '2026-07-01', '2026-07-31', '2026-07-31', 'Paid', 12, 148500.00, 18500.00, 31200.00, 117300.00, 'Level-5 Fleet Admiral', '2026-07-30 14:00:00+00', 'Council of Fleet Admirals', '2026-07-31 09:30:00+00', 12, 'July lunar rotation complete. All crew paid.'),
(2, 'August 2026 Flight Crew Cycle', 'PR-202608-001', 'Standard Quantum Compensation', '2026-08-01', '2026-08-31', '2026-08-31', 'Paid', 12, 151200.00, 19200.00, 32100.00, 119100.00, 'Level-5 Fleet Admiral', '2026-08-30 16:00:00+00', 'Council of Fleet Admirals', '2026-08-31 10:15:00+00', 12, 'August propulsion upgrade bonus included.'),
(3, 'September 2026 Orbital Cycle', 'PR-202609-001', 'Standard Quantum Compensation', '2026-09-01', '2026-09-30', '2026-09-30', 'Validated', 12, 154800.00, 20100.00, 32800.00, 122000.00, 'Elena Vance-Reyes (Level-5)', '2026-09-26 18:00:00+00', NULL, NULL, 0, 'Current active payrun ready for final disbursement and teleport email delivery.')
ON CONFLICT (run_code) DO NOTHING;

-- Reset sequence to avoid collision
SELECT setval('payruns_id_seq', (SELECT MAX(id) FROM payruns));

-- 2. Seed Payslips for September 2026 (Payrun ID 3) and August (ID 2)
DO $$
DECLARE
    emp RECORD;
    ctr RECORD;
    m_base NUMERIC(12,2);
    m_allow NUMERIC(12,2);
    m_bonus NUMERIC(12,2);
    m_gross NUMERIC(12,2);
    m_tax NUMERIC(12,2);
    m_med NUMERIC(12,2);
    m_pen NUMERIC(12,2);
    m_ded NUMERIC(12,2);
    m_net NUMERIC(12,2);
    slip_num VARCHAR(60);
    trace_json JSONB;
BEGIN
    FOR emp IN SELECT id, employee_id, first_name, last_name, email, job_position FROM employees LOOP
        -- Lookup active contract
        SELECT id, base_salary, gravity_allowance INTO ctr FROM contracts WHERE employee_id = emp.id AND status = 'active' LIMIT 1;
        
        IF ctr.id IS NOT NULL THEN
            m_base := ROUND((ctr.base_salary / 12.0)::NUMERIC, 2);
            m_allow := ROUND((ctr.gravity_allowance / 12.0)::NUMERIC, 2);
        ELSE
            m_base := 10000.00;
            m_allow := 1250.00;
        END IF;

        -- Overtime/propulsion bonus based on employee role
        IF emp.id IN (1, 4, 8) THEN
            m_bonus := 650.00; -- High-G propulsion bonus
        ELSIF emp.id IN (3, 5) THEN
            m_bonus := 450.00; -- Quantum ledger bonus
        ELSE
            m_bonus := 200.00;
        END IF;

        m_gross := m_base + m_allow + m_bonus;
        m_tax := ROUND((m_gross * 0.15)::NUMERIC, 2); -- 15% Quantum Tax
        m_med := ROUND((m_gross * 0.025)::NUMERIC, 2); -- 2.5% Atmospheric Fund
        m_pen := ROUND((m_gross * 0.05)::NUMERIC, 2); -- 5% Interplanetary Pension
        m_ded := m_tax + m_med + m_pen;
        m_net := m_gross - m_ded;

        slip_num := 'PSL-202609-' || emp.employee_id;

        trace_json := jsonb_build_object(
            'engine', '/quantum-payslip-engine',
            'contract_id', ctr.id,
            'contract_annual_base', COALESCE(ctr.base_salary, 120000.00),
            'contract_annual_allowance', COALESCE(ctr.gravity_allowance, 15000.00),
            'formula', 'Net = (Base/12 + Allowance/12 + PropulsionBonus) - (QuantumTax[15%] + MedicalAtmosphere[2.5%] + PlanetaryPension[5%])',
            'worked_days', 22.0,
            'worked_hours', 176.0,
            'tax_bracket', 'Interplanetary Tier-B (15%)',
            'quantum_status', 'NOMINAL_CALIBRATED'
        );

        -- September Payslip (Payrun 3)
        INSERT INTO payslips (
            slip_number, payrun_id, employee_id, contract_id, worked_days, total_hours,
            base_salary, gravity_allowance, propulsion_bonus, hazard_allowance,
            quantum_tax, medical_decompression_fund, planetary_pension,
            total_allowances, total_deductions, gross_pay, net_pay,
            status, computation_trace, notes
        ) VALUES (
            slip_num, 3, emp.id, ctr.id, 22.0, 176.00,
            m_base, m_allow, m_bonus, 0.00,
            m_tax, m_med, m_pen,
            (m_allow + m_bonus), m_ded, m_gross, m_net,
            'Generated', trace_json, 'September orbital cycle payslip verified via /quantum-payslip-engine'
        ) ON CONFLICT (payrun_id, employee_id) DO NOTHING;

        -- August Payslip (Payrun 2, status Sent / Paid)
        INSERT INTO payslips (
            slip_number, payrun_id, employee_id, contract_id, worked_days, total_hours,
            base_salary, gravity_allowance, propulsion_bonus, hazard_allowance,
            quantum_tax, medical_decompression_fund, planetary_pension,
            total_allowances, total_deductions, gross_pay, net_pay,
            status, sent_at, sent_to, computation_trace, notes
        ) VALUES (
            'PSL-202608-' || emp.employee_id, 2, emp.id, ctr.id, 22.0, 176.00,
            m_base, m_allow, m_bonus, 0.00,
            m_tax, m_med, m_pen,
            (m_allow + m_bonus), m_ded, m_gross, m_net,
            'Paid', '2026-08-31 10:15:00+00', emp.email, trace_json, 'August payrun archived'
        ) ON CONFLICT (payrun_id, employee_id) DO NOTHING;
    END LOOP;
END $$;
