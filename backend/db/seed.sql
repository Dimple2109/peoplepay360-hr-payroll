-- ====================================================================
-- PeoplePay360: Anti-Gravity Seed Data
-- ====================================================================

-- Clear existing data if any (cascading)
TRUNCATE TABLE propulsion_telemetry_logs, employees, roles, departments RESTART IDENTITY CASCADE;

-- 1. Insert Departments
INSERT INTO departments (code, name, description, head_count_target, budget_allocation, orbital_deck) VALUES
('ENG-QUANTUM', 'Quantum Engineering & Propulsion', 'Designs warp-stabilized payroll algorithms and zero-gravity execution grids', 30, 1850000.00, 'Deck 01 - Primary Propulsion Ring'),
('HR-ORBITAL', 'Orbital HR & Talent Dynamics', 'Coordinates human potential, levitation training, and zero-G wellness routines', 15, 620000.00, 'Deck 02 - Biosphere & Habitation'),
('FIN-ZEROG', 'Zero-G Payroll & Financial Systems', 'Autonomous multi-planetary compensation distribution and quantum tax ledgers', 18, 980000.00, 'Deck 03 - Quantum Vault & Ledgers'),
('OPS-AGRAV', 'Anti-Gravity Flight Operations', 'Maintains orbital trajectory, field stabilizers, and inertial dampers', 22, 1450000.00, 'Deck 04 - Bridge & Thruster Array'),
('SEC-COSMIC', 'Cosmic Compliance & Security', 'Enforces interplanetary labor charters, clearance shields, and cyber telemetry', 12, 790000.00, 'Deck 05 - Sub-Space Comms Citadel');

-- 2. Insert Roles
INSERT INTO roles (code, title, clearance_level, department_id, salary_min, salary_max) VALUES
('PAG-ARCH', 'Principal Anti-Gravity Architect', 'Level-5 Fleet Admiral', 1, 160000.00, 240000.00),
('QDB-COMM', 'Quantum Database Commander', 'Level-4 Commander', 1, 140000.00, 205000.00),
('OHR-DIR', 'Orbital HR Dynamics Director', 'Level-4 Commander', 2, 130000.00, 195000.00),
('TAL-SPEC', 'Zero-G Talent Acquisition Specialist', 'Level-2 Specialist', 2, 85000.00, 125000.00),
('ZGC-LEAD', 'Lead Zero-G Payroll Strategist', 'Level-4 Commander', 3, 135000.00, 190000.00),
('COMP-ANL', 'Quantum Compensation Analyst', 'Level-2 Specialist', 3, 90000.00, 130000.00),
('FLT-OPS', 'Flight Dynamics & Thruster Controller', 'Level-3 Officer', 4, 110000.00, 165000.00),
('INERT-ENG', 'Inertial Dampener Engineer', 'Level-2 Specialist', 4, 95000.00, 145000.00),
('CYBER-OFF', 'Sub-Space Security Officer', 'Level-3 Officer', 5, 115000.00, 175000.00),
('CADET-ORB', 'Orbital Systems Cadet', 'Level-1 Cadet', 1, 65000.00, 85000.00);

-- 3. Insert Employees (with managers, schedules, job positions, and Kanban statuses)
-- Statuses: Active, Onboarding, On-Leave, Suspended

-- 3.1 Leadership / Managers
INSERT INTO employees (employee_id, first_name, last_name, email, phone, avatar_url, department_id, role_id, job_position, manager_id, schedule, status, work_location, employment_type, hire_date, base_salary, gravity_allowance, anti_gravity_rating, clearance_tier, notes) VALUES
('PP360-1001', 'Elena', 'Vance-Reyes', 'elena.vance@peoplepay360.io', '+1 (555) 019-2041', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 1, 1, 'Principal Anti-Gravity Architect', NULL, 'Orbital Shift Alpha (6AM-2PM)', 'Active', 'Orbital Station Alpha', 'Full-Time Quantum Sync', '2023-01-15', 215000.00, 25000.00, 'AG-X', 'Level-5 Fleet Admiral', 'Pioneered quantum field payroll synchronization engine.'),

('PP360-1002', 'Marcus', 'Sterling', 'marcus.sterling@peoplepay360.io', '+1 (555) 019-4822', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 2, 3, 'Orbital HR Dynamics Director', NULL, 'Standard Earth-Sync (9AM-5PM)', 'Active', 'Earth Command HQ / Hybrid', 'Full-Time Quantum Sync', '2023-03-01', 180000.00, 18000.00, 'AG-9', 'Level-4 Commander', 'Supervises all interstellar talent acquisition and astronautical benefits.'),

('PP360-1003', 'Dr. Zara', 'Chen', 'zara.chen@peoplepay360.io', '+1 (555) 019-8933', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 3, 5, 'Lead Zero-G Payroll Strategist', NULL, 'Zero-G Flextime', 'Active', 'Orbital Station Alpha', 'Full-Time Quantum Sync', '2023-04-10', 178000.00, 20000.00, 'AG-9', 'Level-4 Commander', 'Created the multi-currency crypto-gravitational ledger.'),

('PP360-1004', 'Kaelen', 'Thorne', 'kaelen.thorne@peoplepay360.io', '+1 (555) 019-3319', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 4, 7, 'Flight Dynamics & Thruster Controller', NULL, 'Lunar Stasis Rotation', 'Active', 'Deep Space Trans-Orbital', 'Full-Time Quantum Sync', '2023-06-20', 155000.00, 22000.00, 'AG-X', 'Level-3 Officer', 'Oversees physical orbital velocity and server rack microgravity dampeners.');

-- 3.2 Staff reporting to Managers
INSERT INTO employees (employee_id, first_name, last_name, email, phone, avatar_url, department_id, role_id, job_position, manager_id, schedule, status, work_location, employment_type, hire_date, base_salary, gravity_allowance, anti_gravity_rating, clearance_tier, notes) VALUES
('PP360-1005', 'Aria', 'Kowalski', 'aria.kowalski@peoplepay360.io', '+1 (555) 019-7411', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 1, 2, 'Quantum Database Commander', 1, 'Orbital Shift Alpha (6AM-2PM)', 'Active', 'Orbital Station Alpha', 'Full-Time Quantum Sync', '2023-09-01', 165000.00, 18000.00, 'AG-9', 'Level-4 Commander', 'Spearheading the /quantum-database-pooling infrastructure.'),

('PP360-1006', 'Darius', 'Okonkwo', 'darius.okonkwo@peoplepay360.io', '+1 (555) 019-6234', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 2, 4, 'Zero-G Talent Acquisition Specialist', 2, 'Standard Earth-Sync (9AM-5PM)', 'Active', 'Earth Command HQ', 'Full-Time Quantum Sync', '2024-01-12', 98000.00, 10000.00, 'AG-7', 'Level-2 Specialist', 'Recruiting top-tier orbital propulsion engineers.'),

('PP360-1007', 'Lyra', 'Nakamura', 'lyra.nakamura@peoplepay360.io', '+1 (555) 019-1589', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 3, 6, 'Quantum Compensation Analyst', 3, 'Zero-G Flextime', 'Onboarding', 'Remote / Lunar Relay', 'Full-Time Quantum Sync', '2026-09-15', 105000.00, 12000.00, 'AG-5', 'Level-2 Specialist', 'Currently calibrating to zero-g taxation modules and microgravity benefits.'),

('PP360-1008', 'Caspian', 'Valerius', 'caspian.valerius@peoplepay360.io', '+1 (555) 019-9022', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', 4, 8, 'Inertial Dampener Engineer', 4, 'Orbital Shift Alpha (6AM-2PM)', 'Active', 'Deck 04 Thruster Core', 'Full-Time Quantum Sync', '2024-04-18', 125000.00, 15000.00, 'AG-9', 'Level-2 Specialist', 'Maintaining magnetic suspension coils on backend database nodes.'),

('PP360-1009', 'Nyx', 'Solaris', 'nyx.solaris@peoplepay360.io', '+1 (555) 019-8176', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 5, 9, 'Sub-Space Security Officer', NULL, 'Standard Earth-Sync (9AM-5PM)', 'Active', 'Deck 05 Citadel', 'Full-Time Quantum Sync', '2023-11-05', 135000.00, 16000.00, 'AG-9', 'Level-3 Officer', 'Enforcing /levitation-auth-middleware and biometric role verification.'),

('PP360-1010', 'Orion', 'Pax', 'orion.pax@peoplepay360.io', '+1 (555) 019-2234', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 1, 10, 'Orbital Systems Cadet', 1, 'Standard Earth-Sync (9AM-5PM)', 'Onboarding', 'Orbital Station Alpha', 'Cadet Apprenticeship', '2026-09-20', 72000.00, 8000.00, 'AG-3', 'Level-1 Cadet', 'Fast-track trainee on weightless state components and React telemetry.'),

('PP360-1011', 'Seraphina', 'Frost', 'seraphina.frost@peoplepay360.io', '+1 (555) 019-4455', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 2, 4, 'Talent Acquisition Coordinator', 2, 'Zero-G Flextime', 'On-Leave', 'Earth Biosphere Resort', 'Full-Time Quantum Sync', '2024-02-14', 92000.00, 10000.00, 'AG-6', 'Level-2 Specialist', 'On gravitational acclimation sabbatical. Returning next quarter.'),

('PP360-1012', 'Jax', 'Vanderbilt', 'jax.vanderbilt@peoplepay360.io', '+1 (555) 019-5566', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', 4, 8, 'Inertial Systems Specialist', 4, 'Lunar Stasis Rotation', 'Suspended', 'Quarantine Deck 09', 'Contract', '2025-05-11', 110000.00, 12000.00, 'AG-2', 'Level-2 Specialist', 'Temporary suspension pending inspection of uncalibrated thruster telemetry.');

-- 4. Insert Initial Propulsion Telemetry Logs
INSERT INTO propulsion_telemetry_logs (event_type, route, method, status_code, execution_time_ms, quantum_pool_active, quantum_pool_idle, thrust_score, client_ip, user_clearance, details) VALUES
('SYSTEM_INITIALIZE', '/api/propulsion/init', 'GET', 200, 4.25, 1, 9, 99.8, '127.0.0.1', 'Level-5 Fleet Admiral', '{"module": "quantum-database-pooling", "status": "nominal", "thrust_vector": "100%"}'),
('AUTH_LEVITATE', '/api/auth/verify', 'POST', 200, 1.82, 2, 8, 99.9, '127.0.0.1', 'Level-4 Commander', '{"token": "levitated-frictionless", "clearance": "GRANTED"}'),
('DB_POOL_WARMUP', '/api/employees', 'GET', 200, 8.40, 3, 7, 98.7, '127.0.0.1', 'Level-3 Officer', '{"pool_status": "superconducting", "nodes_online": 5}');
