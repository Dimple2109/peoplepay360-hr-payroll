-- ====================================================================
-- PeoplePay360: Anti-Gravity Attendance & Time Off Seed Data
-- ====================================================================

-- 1. Insert Time Off Types
INSERT INTO time_off_types (code, name, description, default_days_per_year, color_hex, requires_approval, is_paid) VALUES
('LUNAR-PTO',  'Lunar Annual Leave (PTO)',            'Paid orbital holiday and interplanetary leisure allowance', 24.0, '#00f0ff', TRUE, TRUE),
('GRAV-SICK',  'Gravitational Acclimation & Sick',     'Medical recovery from zero-G vertigo, radiation, or decompression', 12.0, '#10b981', TRUE, TRUE),
('WARP-SABB',  'Deep Space & Warp Sabbatical',         'Extended multi-planetary research or cosmic sabbatical rotation', 30.0, '#8b5cf6', TRUE, TRUE),
('SOLAR-EMG',  'Solar Flare & Decompression Leave',   'Immediate hazard quarantine and emergency shelter evacuation leave', 7.0, '#f59e0b', FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Time Off Allocations for Year 2026 for all 12 employees
-- /zero-g-timeoff-allocator
DO $$
DECLARE
    emp RECORD;
    t_pto_id INTEGER;
    t_sick_id INTEGER;
    t_sabb_id INTEGER;
    t_emg_id INTEGER;
BEGIN
    SELECT id INTO t_pto_id FROM time_off_types WHERE code = 'LUNAR-PTO';
    SELECT id INTO t_sick_id FROM time_off_types WHERE code = 'GRAV-SICK';
    SELECT id INTO t_sabb_id FROM time_off_types WHERE code = 'WARP-SABB';
    SELECT id INTO t_emg_id FROM time_off_types WHERE code = 'SOLAR-EMG';

    FOR emp IN SELECT id FROM employees LOOP
        -- Lunar PTO
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, total_days, used_days, valid_from, valid_to, notes)
        VALUES (emp.id, t_pto_id, 2026, 24.0, 4.0, '2026-01-01', '2026-12-31', 'Standard annual orbital allocation')
        ON CONFLICT (employee_id, time_off_type_id, year) DO NOTHING;

        -- Grav Sick
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, total_days, used_days, valid_from, valid_to, notes)
        VALUES (emp.id, t_sick_id, 2026, 12.0, 1.5, '2026-01-01', '2026-12-31', 'Zero-G vestibular safety credit')
        ON CONFLICT (employee_id, time_off_type_id, year) DO NOTHING;

        -- Warp Sabbatical
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, total_days, used_days, valid_from, valid_to, notes)
        VALUES (emp.id, t_sabb_id, 2026, 30.0, CASE WHEN emp.id = 11 THEN 15.0 ELSE 0.0 END, '2026-01-01', '2026-12-31', 'Long-range exploration quota')
        ON CONFLICT (employee_id, time_off_type_id, year) DO NOTHING;

        -- Solar Emergency
        INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, total_days, used_days, valid_from, valid_to, notes)
        VALUES (emp.id, t_emg_id, 2026, 7.0, 0.0, '2026-01-01', '2026-12-31', 'Contingency cosmic ray allowance')
        ON CONFLICT (employee_id, time_off_type_id, year) DO NOTHING;
    END LOOP;
END $$;

-- 3. Insert Attendance Logs for Recent Days (Past 4 days + Today 2026-09-27)
-- /orbital-attendance-sync & /gravity-exception-detector
INSERT INTO attendance_logs (employee_id, date, check_in, check_out, worked_hours, status, is_manual_override, override_reason, override_by, is_exception, exception_type, exception_notes) VALUES
-- Elena Vance-Reyes (id 1)
(1, '2026-09-24', '2026-09-24 06:02:00+00', '2026-09-24 14:15:00+00', 8.22, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Nominal orbital warp synchronization'),
(1, '2026-09-25', '2026-09-25 05:58:00+00', '2026-09-25 15:30:00+00', 9.53, 'Overtime', FALSE, NULL, NULL, FALSE, NULL, 'Propulsion reactor recalibration overtime'),
(1, '2026-09-26', '2026-09-26 06:00:00+00', '2026-09-26 14:00:00+00', 8.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Standard flight duty'),
(1, '2026-09-27', '2026-09-27 05:55:00+00', '2026-09-27 14:05:00+00', 8.17, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Active shift completed'),

-- Marcus Sterling (id 2)
(2, '2026-09-25', '2026-09-25 08:55:00+00', '2026-09-25 17:00:00+00', 8.08, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Earth-Sync remote deck'),
(2, '2026-09-26', '2026-09-26 09:00:00+00', '2026-09-26 17:05:00+00', 8.08, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Standard shift completed'),
(2, '2026-09-27', '2026-09-27 08:58:00+00', NULL, 0.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Currently on station duty (open shift)'),

-- Dr. Zara Chen (id 3)
(3, '2026-09-26', '2026-09-26 09:10:00+00', '2026-09-26 17:40:00+00', 8.50, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Zero-G Flextime completed'),
(3, '2026-09-27', '2026-09-27 09:05:00+00', NULL, 0.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Ledger reconciliation shift in progress'),

-- Kaelen Thorne (id 4)
(4, '2026-09-26', '2026-09-26 08:00:00+00', '2026-09-26 18:30:00+00', 10.50, 'Overtime', FALSE, NULL, NULL, FALSE, NULL, 'Deep space trans-orbital maneuver overtime'),
(4, '2026-09-27', '2026-09-27 08:00:00+00', '2026-09-27 16:30:00+00', 8.50, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Thruster array nominal'),

-- Aria Kowalski (id 5)
(5, '2026-09-26', '2026-09-26 06:00:00+00', '2026-09-26 14:00:00+00', 8.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Quantum pool monitoring'),
(5, '2026-09-27', '2026-09-27 06:05:00+00', '2026-09-27 14:10:00+00', 8.08, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Superconducting lifecycle verification'),

-- Darius Okonkwo (id 6)
(6, '2026-09-26', '2026-09-26 09:00:00+00', '2026-09-26 17:00:00+00', 8.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Talent interview syncs'),
(6, '2026-09-27', '2026-09-27 09:12:00+00', NULL, 0.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Cadet screening interviews'),

-- Lyra Nakamura (id 7) — EXCEPTION: Late entry
(7, '2026-09-26', '2026-09-26 09:48:00+00', '2026-09-26 17:30:00+00', 7.70, 'Late', FALSE, NULL, NULL, TRUE, 'LATE_ENTRY', 'Arrived 48 mins past standard 09:00 schedule due to shuttle airlock queue'),
(7, '2026-09-27', '2026-09-27 09:42:00+00', '2026-09-27 17:45:00+00', 8.05, 'Late', FALSE, NULL, NULL, TRUE, 'LATE_ENTRY', 'Lunar relay latency delayed magnetic lock passage by 42 mins'),

-- Caspian Valerius (id 8) — EXCEPTION: Manual Override
(8, '2026-09-26', '2026-09-26 06:00:00+00', '2026-09-26 14:00:00+00', 8.00, 'Present', TRUE, 'Manual entry authorized: Deck 04 biometric beacon sensor was under magnetic maintenance.', 'Elena Vance-Reyes', TRUE, 'MANUAL_EDIT', 'Override confirmed by Admiral Vance-Reyes with verified station log timestamp'),
(8, '2026-09-27', '2026-09-27 06:10:00+00', '2026-09-27 14:15:00+00', 8.08, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Coil dampener maintenance shift'),

-- Nyx Solaris (id 9)
(9, '2026-09-26', '2026-09-26 08:50:00+00', '2026-09-26 17:00:00+00', 8.17, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Security patrol Deck 05'),
(9, '2026-09-27', '2026-09-27 08:52:00+00', NULL, 0.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Sub-space perimeter monitoring'),

-- Orion Pax (id 10) — EXCEPTION: Missing Checkout (Yesterday shift unclosed!)
(10, '2026-09-26', '2026-09-26 09:00:00+00', NULL, 0.00, 'Present', FALSE, NULL, NULL, TRUE, 'MISSING_CHECKOUT', 'Cadet clocked in at 09:00 yesterday but no checkout beacon detected within 14 hours'),
(10, '2026-09-27', '2026-09-27 09:02:00+00', NULL, 0.00, 'Present', FALSE, NULL, NULL, FALSE, NULL, 'Current cadet apprenticeship rotation'),

-- Seraphina Frost (id 11) — On Leave
(11, '2026-09-26', NULL, NULL, 0.00, 'On-Leave', FALSE, NULL, NULL, FALSE, NULL, 'Approved Gravitational Sabbatical leave'),
(11, '2026-09-27', NULL, NULL, 0.00, 'On-Leave', FALSE, NULL, NULL, FALSE, NULL, 'Approved Gravitational Sabbatical leave'),

-- Jax Vanderbilt (id 12) — Absent / Suspended
(12, '2026-09-26', NULL, NULL, 0.00, 'Absent', FALSE, NULL, NULL, FALSE, NULL, 'Quarantined - Uncalibrated thrusters'),
(12, '2026-09-27', NULL, NULL, 0.00, 'Absent', FALSE, NULL, NULL, FALSE, NULL, 'Quarantined - Pending tribunal inspection');


-- 4. Insert Time Off Requests (Pending, Approved, Refused)
-- /zero-g-timeoff-allocator
INSERT INTO time_off_requests (request_ref, employee_id, time_off_type_id, start_date, end_date, duration_days, reason, status, approved_by, approved_at, rejection_reason) VALUES
-- Approved sabbatical for Seraphina Frost
('TOR-202609-0001', 11, 3, '2026-09-20', '2026-10-04', 15.0, 'Acclimation sabbatical at Earth Biosphere Resort following 18-month high-G rotation', 'Approved', 'Marcus Sterling', '2026-09-18 10:30:00+00', NULL),

-- Approved sick leave for Marcus Sterling
('TOR-202609-0002', 2, 2, '2026-08-14', '2026-08-15', 1.5, 'Microgravity ear canal recalibration & atmospheric decompression therapy', 'Approved', 'Elena Vance-Reyes', '2026-08-13 16:00:00+00', NULL),

-- Pending Lunar PTO for Elena Vance-Reyes
('TOR-202609-0003', 1, 1, '2026-10-12', '2026-10-16', 5.0, 'Annual orbital shore leave to Lunar Base Hadley Rille for gravitational decompression', 'Pending', NULL, NULL, NULL),

-- Pending PTO for Aria Kowalski
('TOR-202609-0004', 5, 1, '2026-10-05', '2026-10-07', 3.0, 'Trans-lunar transit to attend the Interplanetary Quantum Database Symposium', 'Pending', NULL, NULL, NULL),

-- Refused request for Darius Okonkwo
('TOR-202609-0005', 6, 1, '2026-09-28', '2026-10-02', 5.0, 'Personal leave during critical astronaut candidate recruitment propulsion trials', 'Refused', 'Marcus Sterling', '2026-09-25 14:20:00+00', 'Conflicting schedule with Fleet Admiral onboard review week. Please reschedule after Deck 02 inspection.'),

-- Pending sick leave for Lyra Nakamura
('TOR-202609-0006', 7, 2, '2026-09-29', '2026-09-30', 2.0, 'Scheduled vestibular adaptation training and inner-ear gravity calibration', 'Pending', NULL, NULL, NULL);
