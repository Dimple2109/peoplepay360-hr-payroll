// ====================================================================
// /quantum-database-pooling — Resilient Quantum In-Memory Failover Matrix
// Autonomous in-memory database engine pre-seeded with all orbital datasets:
//  - /quantum-salary-structuring: salary_structures & salary_rules
//  - employees, departments, roles, contracts, schedules, attendance, time-off
// Activated automatically whenever PostgreSQL instance is unlinked or offline.
// ====================================================================

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'db', 'quantum_memory_state.json');

// Initial seed data for Salary Structures (/quantum-salary-structuring)
const INITIAL_SALARY_STRUCTURES = [
  {
    id: 1,
    code: 'STRUCT-ORB-REG',
    name: 'Regular Orbital Salary',
    description: 'Standard anti-gravity compensation container for orbital station crew and mission personnel. Calibrated for standard Earth-sync schedules and gravity allowances.',
    wage_type: 'monthly',
    company_contribution: 850.00,
    is_active: true,
    currency: 'USD',
    version: 1,
    notes: 'Primary compensation tier for Station Alpha crew members.',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'STRUCT-WARP-EXEC',
    name: 'Executive Warp-Tier',
    description: 'High-clearance warp trajectory package for Fleet Admirals and Chief Engineers, featuring gravity scaling, warp propulsion incentives, and command quarters subsidies.',
    wage_type: 'monthly',
    company_contribution: 1800.00,
    is_active: true,
    currency: 'USD',
    version: 1,
    notes: 'Reserved for Level-4 Commander and Level-5 Fleet Admiral ranks.',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    code: 'STRUCT-DS-MIS',
    name: 'Deep Space Mission Pay',
    description: 'Mission-contingent payload computation with cryogenic standby allowances, radiation differentials, and thruster equipment deductions.',
    wage_type: 'mission',
    company_contribution: 500.00,
    is_active: true,
    currency: 'USD',
    version: 1,
    notes: 'Calibrated for deep-space sorties and long-range orbital exploration.',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  }
];

// Initial seed data for Salary Rules (/gravitational-rule-engine & /warp-computation-matrix)
const INITIAL_SALARY_RULES = [
  // 1. Regular Orbital Salary Rules (Structure 1)
  {
    id: 1,
    salary_structure_id: 1,
    name: 'Base Orbital Salary',
    code: 'BASIC',
    category: 'basic',
    sequence: 10,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 100.00,
    formula: 'base_salary / 12',
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Full monthly base contract salary derived from annual contract',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    salary_structure_id: 1,
    name: 'Gravitational Dispersion Allowance',
    code: 'GRAV_ALLOW',
    category: 'allowance',
    sequence: 20,
    computation_type: 'fixed',
    amount: 1000.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Zero-G bone density and muscle preservation allowance',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    salary_structure_id: 1,
    name: 'Orbital Hazard Differential',
    code: 'ORB_HAZARD',
    category: 'allowance',
    sequence: 30,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 12.00,
    formula: 'BASIC * 0.12',
    base_rule_id: 1,
    is_active: true,
    is_taxable: true,
    notes: '12% hazard compensation on basic orbital salary',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    salary_structure_id: 1,
    name: 'Cosmic Radiation Protection Subsidy',
    code: 'RADIATION_SUBSIDY',
    category: 'allowance',
    sequence: 40,
    computation_type: 'fixed',
    amount: 450.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Radiation shield and medical nanite monitoring stipend',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    salary_structure_id: 1,
    name: 'Gross Orbital Compensation',
    code: 'GROSS',
    category: 'gross',
    sequence: 100,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'BASIC + GRAV_ALLOW + ORB_HAZARD + RADIATION_SUBSIDY',
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Computed gross orbital earnings before deductions',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    salary_structure_id: 1,
    name: 'Galactic Provident & Pension Fund',
    code: 'ORB_PENSION',
    category: 'deduction',
    sequence: 110,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 8.00,
    formula: 'GROSS * 0.08',
    base_rule_id: 5,
    is_active: true,
    is_taxable: false,
    notes: '8% statutory Galactic Retirement withholding',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    salary_structure_id: 1,
    name: 'Orbital Station Habitat Withholding Tax',
    code: 'STATION_TAX',
    category: 'deduction',
    sequence: 120,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'GROSS * 0.15',
    base_rule_id: 5,
    is_active: true,
    is_taxable: false,
    notes: '15% habitat infrastructure maintenance withholding',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    salary_structure_id: 1,
    name: 'Spacewalk & EVA Liability Insurance',
    code: 'EVA_INSURANCE',
    category: 'deduction',
    sequence: 130,
    computation_type: 'fixed',
    amount: 350.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Standard extravehicular activity liability coverage',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 9,
    salary_structure_id: 1,
    name: 'Net Quantum Disbursable Payout',
    code: 'NET',
    category: 'net',
    sequence: 200,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'GROSS - (ORB_PENSION + STATION_TAX + EVA_INSURANCE)',
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Final net credited payout transferred to crew wallet',
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. Executive Warp-Tier Rules (Structure 2)
  {
    id: 10,
    salary_structure_id: 2,
    name: 'Executive Base Salary',
    code: 'EXEC_BASIC',
    category: 'basic',
    sequence: 10,
    computation_type: 'fixed',
    amount: 16500.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Command deck tier baseline monthly salary',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 11,
    salary_structure_id: 2,
    name: 'Warp Velocity Propulsion Incentive',
    code: 'WARP_PROPULSION',
    category: 'allowance',
    sequence: 20,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 25.00,
    formula: 'EXEC_BASIC * 0.25',
    base_rule_id: 10,
    is_active: true,
    is_taxable: true,
    notes: '25% warp synchronization incentive',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 12,
    salary_structure_id: 2,
    name: 'Command Deck Quarters & Life Support',
    code: 'ADMIRAL_QUARTERS',
    category: 'allowance',
    sequence: 30,
    computation_type: 'fixed',
    amount: 3200.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Dedicated habitat suite with isolated life support',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 13,
    salary_structure_id: 2,
    name: 'Gross Warp Compensation',
    code: 'GROSS',
    category: 'gross',
    sequence: 100,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'EXEC_BASIC + WARP_PROPULSION + ADMIRAL_QUARTERS',
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Total gross executive compensation',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 14,
    salary_structure_id: 2,
    name: 'Interplanetary High-Bracket Income Tax',
    code: 'DEEP_SPACE_TAX',
    category: 'deduction',
    sequence: 110,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'GROSS * 0.22',
    base_rule_id: 13,
    is_active: true,
    is_taxable: false,
    notes: '22% interplanetary high bracket tax',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 15,
    salary_structure_id: 2,
    name: 'Superconducting Energy Core Reserve',
    code: 'QUANTUM_RESERVE',
    category: 'deduction',
    sequence: 120,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 5.00,
    formula: 'GROSS * 0.05',
    base_rule_id: 13,
    is_active: true,
    is_taxable: false,
    notes: '5% fleet defense and energy escrow',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 16,
    salary_structure_id: 2,
    name: 'Net Executive Disbursable',
    code: 'NET',
    category: 'net',
    sequence: 200,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'GROSS - (DEEP_SPACE_TAX + QUANTUM_RESERVE)',
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Final net executive disbursal',
    created_at: new Date('2025-01-10T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. Deep Space Mission Pay Rules (Structure 3)
  {
    id: 17,
    salary_structure_id: 3,
    name: 'Mission Baseline Pay',
    code: 'MISSION_BASE',
    category: 'basic',
    sequence: 10,
    computation_type: 'fixed',
    amount: 7500.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Base mission stipend for duration of assignment',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 18,
    salary_structure_id: 3,
    name: 'Cryogenic Stasis Standby Allowance',
    code: 'CRYO_STANDBY',
    category: 'allowance',
    sequence: 20,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 18.00,
    formula: 'MISSION_BASE * 0.18',
    base_rule_id: 17,
    is_active: true,
    is_taxable: true,
    notes: '18% hazard allowance during deep stasis phases',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 19,
    salary_structure_id: 3,
    name: 'Orbital Telemetry Differential',
    code: 'TELEMETRY_DIFF',
    category: 'allowance',
    sequence: 30,
    computation_type: 'fixed',
    amount: 800.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Real-time telemetry uplink shift allowance',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 20,
    salary_structure_id: 3,
    name: 'Gross Mission Pay',
    code: 'GROSS',
    category: 'gross',
    sequence: 100,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'MISSION_BASE + CRYO_STANDBY + TELEMETRY_DIFF',
    base_rule_id: null,
    is_active: true,
    is_taxable: true,
    notes: 'Total mission gross earnings',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 21,
    salary_structure_id: 3,
    name: 'Thruster Suit Wear & Tear Depreciation',
    code: 'EQUIP_DEPREC',
    category: 'deduction',
    sequence: 110,
    computation_type: 'fixed',
    amount: 320.00,
    percentage: 0.00,
    formula: null,
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Personal propulsion gear inspection and servicing fee',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 22,
    salary_structure_id: 3,
    name: 'Contractor Withholding Levy',
    code: 'CONTRACTOR_LEVY',
    category: 'deduction',
    sequence: 120,
    computation_type: 'percentage',
    amount: 0.00,
    percentage: 10.00,
    formula: 'GROSS * 0.10',
    base_rule_id: 20,
    is_active: true,
    is_taxable: false,
    notes: '10% contractor mission withholding',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 23,
    salary_structure_id: 3,
    name: 'Net Mission Disbursal',
    code: 'NET',
    category: 'net',
    sequence: 200,
    computation_type: 'formula',
    amount: 0.00,
    percentage: 0.00,
    formula: 'GROSS - (EQUIP_DEPREC + CONTRACTOR_LEVY)',
    base_rule_id: null,
    is_active: true,
    is_taxable: false,
    notes: 'Net payout transferred upon mission milestone signoff',
    created_at: new Date('2025-02-01T00:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  }
];

class QuantumMemoryAdapter {
  constructor() {
    this.state = this._loadInitialState();
  }

  _loadInitialState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.salary_structures || parsed.salary_structures.length === 0) {
          parsed.salary_structures = JSON.parse(JSON.stringify(INITIAL_SALARY_STRUCTURES));
        }
        if (!parsed.salary_rules || parsed.salary_rules.length === 0) {
          parsed.salary_rules = JSON.parse(JSON.stringify(INITIAL_SALARY_RULES));
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[QUANTUM-MEMORY] Could not load state from disk, using fresh defaults:', e.message);
    }

    const defaultState = this._createDefaultState();
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
    } catch (_) {}
    return defaultState;
  }

  _createDefaultState() {
    const departments = [
      { id: 1, code: 'ENG-QUANTUM', name: 'Quantum Engineering & Propulsion', description: 'Designs warp-stabilized payroll algorithms and zero-gravity execution grids', head_count_target: 30, budget_allocation: 1850000.00, orbital_deck: 'Deck 01 - Primary Propulsion Ring' },
      { id: 2, code: 'HR-ORBITAL', name: 'Orbital HR & Talent Dynamics', description: 'Coordinates human potential, levitation training, and zero-G wellness routines', head_count_target: 15, budget_allocation: 620000.00, orbital_deck: 'Deck 02 - Biosphere & Habitation' },
      { id: 3, code: 'FIN-ZEROG', name: 'Zero-G Payroll & Financial Systems', description: 'Autonomous multi-planetary compensation distribution and quantum tax ledgers', head_count_target: 18, budget_allocation: 980000.00, orbital_deck: 'Deck 03 - Quantum Vault & Ledgers' },
      { id: 4, code: 'OPS-AGRAV', name: 'Anti-Gravity Flight Operations', description: 'Maintains orbital trajectory, field stabilizers, and inertial dampers', head_count_target: 22, budget_allocation: 1450000.00, orbital_deck: 'Deck 04 - Bridge & Thruster Array' },
      { id: 5, code: 'SEC-COSMIC', name: 'Cosmic Compliance & Security', description: 'Enforces interplanetary labor charters, clearance shields, and cyber telemetry', head_count_target: 12, budget_allocation: 790000.00, orbital_deck: 'Deck 05 - Sub-Space Comms Citadel' },
    ];

    const roles = [
      { id: 1, code: 'PAG-ARCH', title: 'Principal Anti-Gravity Architect', clearance_level: 'Level-5 Fleet Admiral', department_id: 1, salary_min: 160000.00, salary_max: 240000.00 },
      { id: 2, code: 'QDB-COMM', title: 'Quantum Database Commander', clearance_level: 'Level-4 Commander', department_id: 1, salary_min: 140000.00, salary_max: 205000.00 },
      { id: 3, code: 'OHR-DIR', title: 'Orbital HR Dynamics Director', clearance_level: 'Level-4 Commander', department_id: 2, salary_min: 130000.00, salary_max: 195000.00 },
      { id: 4, code: 'TAL-SPEC', title: 'Zero-G Talent Acquisition Specialist', clearance_level: 'Level-2 Specialist', department_id: 2, salary_min: 85000.00, salary_max: 125000.00 },
      { id: 5, code: 'ZGC-LEAD', title: 'Lead Zero-G Payroll Strategist', clearance_level: 'Level-4 Commander', department_id: 3, salary_min: 135000.00, salary_max: 190000.00 },
      { id: 6, code: 'COMP-ANL', title: 'Quantum Compensation Analyst', clearance_level: 'Level-2 Specialist', department_id: 3, salary_min: 90000.00, salary_max: 130000.00 },
      { id: 7, code: 'FLT-OPS', title: 'Flight Dynamics & Thruster Controller', clearance_level: 'Level-3 Officer', department_id: 4, salary_min: 110000.00, salary_max: 165000.00 },
      { id: 8, code: 'INERT-ENG', title: 'Inertial Dampener Engineer', clearance_level: 'Level-2 Specialist', department_id: 4, salary_min: 95000.00, salary_max: 145000.00 },
      { id: 9, code: 'CYBER-OFF', title: 'Sub-Space Security Officer', clearance_level: 'Level-3 Officer', department_id: 5, salary_min: 115000.00, salary_max: 175000.00 },
      { id: 10, code: 'CADET-ORB', title: 'Orbital Systems Cadet', clearance_level: 'Level-1 Cadet', department_id: 1, salary_min: 65000.00, salary_max: 85000.00 },
    ];

    const employees = [
      { id: 1, employee_id: 'PP360-1001', first_name: 'Elena', last_name: 'Vance-Reyes', email: 'elena.vance@peoplepay360.io', phone: '+1 (555) 019-2041', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', department_id: 1, role_id: 1, job_position: 'Principal Anti-Gravity Architect', manager_id: null, schedule: 'Orbital Shift Alpha (6AM-2PM)', status: 'Active', work_location: 'Orbital Station Alpha', employment_type: 'Full-Time Quantum Sync', hire_date: '2023-01-15', base_salary: 215000.00, gravity_allowance: 25000.00, anti_gravity_rating: 'AG-X', clearance_tier: 'Level-5 Fleet Admiral', notes: 'Pioneered quantum field payroll synchronization engine.' },
      { id: 2, employee_id: 'PP360-1002', first_name: 'Marcus', last_name: 'Sterling', email: 'marcus.sterling@peoplepay360.io', phone: '+1 (555) 019-4822', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', department_id: 2, role_id: 3, job_position: 'Orbital HR Dynamics Director', manager_id: null, schedule: 'Standard Earth-Sync (9AM-5PM)', status: 'Active', work_location: 'Earth Command HQ / Hybrid', employment_type: 'Full-Time Quantum Sync', hire_date: '2023-03-01', base_salary: 180000.00, gravity_allowance: 18000.00, anti_gravity_rating: 'AG-9', clearance_tier: 'Level-4 Commander', notes: 'Supervises all interstellar talent acquisition.' },
      { id: 3, employee_id: 'PP360-1003', first_name: 'Dr. Zara', last_name: 'Chen', email: 'zara.chen@peoplepay360.io', phone: '+1 (555) 019-8933', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', department_id: 3, role_id: 5, job_position: 'Lead Zero-G Payroll Strategist', manager_id: null, schedule: 'Zero-G Flextime', status: 'Active', work_location: 'Orbital Station Alpha', employment_type: 'Full-Time Quantum Sync', hire_date: '2023-04-10', base_salary: 178000.00, gravity_allowance: 20000.00, anti_gravity_rating: 'AG-9', clearance_tier: 'Level-4 Commander', notes: 'Created multi-currency crypto-gravitational ledger.' },
      { id: 4, employee_id: 'PP360-1004', first_name: 'Kaelen', last_name: 'Thorne', email: 'kaelen.thorne@peoplepay360.io', phone: '+1 (555) 019-3319', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', department_id: 4, role_id: 7, job_position: 'Flight Dynamics & Thruster Controller', manager_id: null, schedule: 'Lunar Stasis Rotation', status: 'Active', work_location: 'Deep Space Trans-Orbital', employment_type: 'Full-Time Quantum Sync', hire_date: '2023-06-20', base_salary: 155000.00, gravity_allowance: 22000.00, anti_gravity_rating: 'AG-X', clearance_tier: 'Level-3 Officer', notes: 'Oversees physical orbital velocity.' },
      { id: 5, employee_id: 'PP360-1005', first_name: 'Aria', last_name: 'Kowalski', email: 'aria.kowalski@peoplepay360.io', phone: '+1 (555) 019-7411', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', department_id: 1, role_id: 2, job_position: 'Quantum Database Commander', manager_id: 1, schedule: 'Orbital Shift Alpha (6AM-2PM)', status: 'Active', work_location: 'Orbital Station Alpha', employment_type: 'Full-Time Quantum Sync', hire_date: '2023-09-01', base_salary: 165000.00, gravity_allowance: 18000.00, anti_gravity_rating: 'AG-9', clearance_tier: 'Level-4 Commander', notes: 'Spearheading database pooling.' },
      { id: 6, employee_id: 'PP360-1006', first_name: 'Darius', last_name: 'Okonkwo', email: 'darius.okonkwo@peoplepay360.io', phone: '+1 (555) 019-6234', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', department_id: 2, role_id: 4, job_position: 'Zero-G Talent Acquisition Specialist', manager_id: 2, schedule: 'Standard Earth-Sync (9AM-5PM)', status: 'Active', work_location: 'Earth Command HQ', employment_type: 'Full-Time Quantum Sync', hire_date: '2024-01-12', base_salary: 98000.00, gravity_allowance: 10000.00, anti_gravity_rating: 'AG-7', clearance_tier: 'Level-2 Specialist', notes: 'Recruiting propulsion engineers.' },
      { id: 7, employee_id: 'PP360-1007', first_name: 'Lyra', last_name: 'Nakamura', email: 'lyra.nakamura@peoplepay360.io', phone: '+1 (555) 019-1589', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', department_id: 3, role_id: 6, job_position: 'Quantum Compensation Analyst', manager_id: 3, schedule: 'Zero-G Flextime', status: 'Onboarding', work_location: 'Remote / Lunar Relay', employment_type: 'Full-Time Quantum Sync', hire_date: '2026-09-15', base_salary: 105000.00, gravity_allowance: 12000.00, anti_gravity_rating: 'AG-5', clearance_tier: 'Level-2 Specialist', notes: 'Calibrating zero-g taxation.' },
      { id: 8, employee_id: 'PP360-1008', first_name: 'Caspian', last_name: 'Valerius', email: 'caspian.valerius@peoplepay360.io', phone: '+1 (555) 019-9022', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', department_id: 4, role_id: 8, job_position: 'Inertial Dampener Engineer', manager_id: 4, schedule: 'Orbital Shift Alpha (6AM-2PM)', status: 'Active', work_location: 'Deck 04 Thruster Core', employment_type: 'Full-Time Quantum Sync', hire_date: '2024-04-18', base_salary: 125000.00, gravity_allowance: 15000.00, anti_gravity_rating: 'AG-9', clearance_tier: 'Level-2 Specialist', notes: 'Magnetic suspension coils.' },
      { id: 9, employee_id: 'PP360-1009', first_name: 'Nyx', last_name: 'Solaris', email: 'nyx.solaris@peoplepay360.io', phone: '+1 (555) 019-8176', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', department_id: 5, role_id: 9, job_position: 'Sub-Space Security Officer', manager_id: null, schedule: 'Standard Earth-Sync (9AM-5PM)', status: 'Active', work_location: 'Deck 05 Citadel', employment_type: 'Full-Time Quantum Sync', hire_date: '2023-11-05', base_salary: 135000.00, gravity_allowance: 16000.00, anti_gravity_rating: 'AG-9', clearance_tier: 'Level-3 Officer', notes: 'Enforcing biometric role verification.' },
      { id: 10, employee_id: 'PP360-1010', first_name: 'Orion', last_name: 'Pax', email: 'orion.pax@peoplepay360.io', phone: '+1 (555) 019-2234', avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', department_id: 1, role_id: 10, job_position: 'Orbital Systems Cadet', manager_id: 1, schedule: 'Standard Earth-Sync (9AM-5PM)', status: 'Onboarding', work_location: 'Orbital Station Alpha', employment_type: 'Cadet Apprenticeship', hire_date: '2026-09-20', base_salary: 72000.00, gravity_allowance: 8000.00, anti_gravity_rating: 'AG-3', clearance_tier: 'Level-1 Cadet', notes: 'Fast-track trainee on weightless state components.' },
      { id: 11, employee_id: 'PP360-1011', first_name: 'Seraphina', last_name: 'Frost', email: 'seraphina.frost@peoplepay360.io', phone: '+1 (555) 019-4455', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', department_id: 2, role_id: 4, job_position: 'Talent Acquisition Coordinator', manager_id: 2, schedule: 'Zero-G Flextime', status: 'On-Leave', work_location: 'Earth Biosphere Resort', employment_type: 'Full-Time Quantum Sync', hire_date: '2024-02-14', base_salary: 92000.00, gravity_allowance: 10000.00, anti_gravity_rating: 'AG-6', clearance_tier: 'Level-2 Specialist', notes: 'On gravitational acclimation sabbatical.' },
      { id: 12, employee_id: 'PP360-1012', first_name: 'Jax', last_name: 'Vanderbilt', email: 'jax.vanderbilt@peoplepay360.io', phone: '+1 (555) 019-5566', avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', department_id: 4, role_id: 8, job_position: 'Inertial Systems Specialist', manager_id: 4, schedule: 'Lunar Stasis Rotation', status: 'Suspended', work_location: 'Quarantine Deck 09', employment_type: 'Contract', hire_date: '2025-05-11', base_salary: 110000.00, gravity_allowance: 12000.00, anti_gravity_rating: 'AG-2', clearance_tier: 'Level-2 Specialist', notes: 'Suspension pending thruster inspection.' },
    ];

    const contracts = employees.map((emp, idx) => ({
      id: idx + 1,
      employee_id: emp.id,
      start_date: '2025-01-01',
      end_date: null,
      base_salary: emp.base_salary,
      gravity_allowance: emp.gravity_allowance,
      salary_structure: idx < 4 ? 'Regular Orbital Salary' : idx < 8 ? 'Executive Warp-Tier' : 'Deep Space Mission Pay',
      status: 'active',
      created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const working_schedules = employees.map((emp, idx) => ({
      id: idx + 1,
      employee_id: emp.id,
      schedule_name: emp.schedule,
      effective_date: '2025-01-01',
      mon_start: '09:00', mon_end: '17:00',
      tue_start: '09:00', tue_end: '17:00',
      wed_start: '09:00', wed_end: '17:00',
      thu_start: '09:00', thu_end: '17:00',
      fri_start: '09:00', fri_end: '17:00',
      shift_pattern: 'Standard-5x8',
      is_active: true,
      created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    }));

    return {
      departments,
      roles,
      employees,
      contracts,
      working_schedules,
      attendance_logs: [],
      time_off_types: [
        { id: 1, name: 'Orbital Acclimation Leave', code: 'ORB-ACCLIM', max_days: 14, is_paid: true },
        { id: 2, name: 'Zero-G Re-Centering', code: 'ZEROG-REST', max_days: 10, is_paid: true },
        { id: 3, name: 'Solar Flare Quarantine', code: 'SOLAR-QUAR', max_days: 7, is_paid: true },
      ],
      time_off_allocations: [],
      time_off_requests: [],
      salary_structures: JSON.parse(JSON.stringify(INITIAL_SALARY_STRUCTURES)),
      salary_rules: JSON.parse(JSON.stringify(INITIAL_SALARY_RULES)),
    };
  }

  save() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.error('[QUANTUM-MEMORY] Failed to persist state to disk:', e.message);
    }
  }

  reset() {
    this.state = this._createDefaultState();
    this.save();
    return this.state;
  }

  /**
   * Universal In-Memory SQL Query Interceptor
   */
  async query(text, params = []) {
    const sql = text.trim();
    const upper = sql.toUpperCase();
    const fromMatch = upper.match(/\bFROM\s+([A-Z_]+)/);
    const primaryTable = fromMatch ? fromMatch[1] : '';

    // 1. SALARY STRUCTURES
    if (primaryTable === 'SALARY_STRUCTURES' || upper.startsWith('INSERT INTO SALARY_STRUCTURES') || upper.startsWith('UPDATE SALARY_STRUCTURES') || upper.startsWith('DELETE FROM SALARY_STRUCTURES')) {
      if (upper.startsWith('INSERT INTO SALARY_STRUCTURES')) {
        const nextId = this.state.salary_structures.length > 0
          ? Math.max(...this.state.salary_structures.map(s => s.id)) + 1
          : 1;
        const newStruct = {
          id: nextId,
          code: params[0] ? String(params[0]).trim().toUpperCase() : `STRUCT-${nextId}`,
          name: params[1] ? String(params[1]).trim() : `Structure ${nextId}`,
          description: params[2] || '',
          wage_type: params[3] || 'monthly',
          company_contribution: parseFloat(params[4]) || 0,
          is_active: params[5] !== undefined ? Boolean(params[5]) : true,
          currency: params[6] || 'USD',
          version: 1,
          notes: params[7] || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.state.salary_structures.push(newStruct);
        this.save();
        return { rows: [newStruct], rowCount: 1 };
      }

      if (upper.startsWith('UPDATE SALARY_STRUCTURES')) {
        const sId = parseInt(params[params.length - 1], 10);
        const struct = this.state.salary_structures.find(s => s.id === sId);
        if (struct) {
          if (upper.includes('IS_ACTIVE = $1')) {
            struct.is_active = Boolean(params[0]);
          } else {
            if (params[0]) struct.code = params[0];
            if (params[1]) struct.name = params[1];
            if (params[2] !== null && params[2] !== undefined) struct.description = params[2];
            if (params[3]) struct.wage_type = params[3];
            if (params[4] !== null && params[4] !== undefined) struct.company_contribution = parseFloat(params[4]);
            if (params[5] !== null && params[5] !== undefined) struct.is_active = Boolean(params[5]);
            if (params[6]) struct.currency = params[6];
            if (params[7] !== null && params[7] !== undefined) struct.notes = params[7];
            struct.version = (struct.version || 1) + 1;
          }
          struct.updated_at = new Date().toISOString();
          this.save();
          return { rows: [struct], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (upper.startsWith('DELETE FROM SALARY_STRUCTURES')) {
        const sId = parseInt(params[0], 10);
        this.state.salary_structures = this.state.salary_structures.filter(s => s.id !== sId);
        this.state.salary_rules = this.state.salary_rules.filter(r => r.salary_structure_id !== sId);
        this.save();
        return { rows: [], rowCount: 1 };
      }

      const list = this.state.salary_structures.map(s => {
        const rules = this.state.salary_rules.filter(r => r.salary_structure_id === s.id && r.is_active);
        const assignedContracts = this.state.contracts.filter(c =>
          c.status === 'active' && (c.salary_structure === s.name || c.salary_structure === s.code)
        );
        return {
          ...s,
          total_rules: rules.length,
          basic_rule_count: rules.filter(r => r.category === 'basic').length,
          allowance_rule_count: rules.filter(r => r.category === 'allowance').length,
          deduction_rule_count: rules.filter(r => r.category === 'deduction').length,
          gross_rule_count: rules.filter(r => r.category === 'gross').length,
          net_rule_count: rules.filter(r => r.category === 'net').length,
          assigned_employees: assignedContracts.length,
        };
      });

      if (upper.includes('WHERE S.ID = $1') || upper.includes('WHERE ID = $1')) {
        const sId = parseInt(params[0], 10);
        const match = list.find(s => s.id === sId);
        return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
      }

      return { rows: list, rowCount: list.length };
    }

    // 2. SALARY RULES
    if (primaryTable === 'SALARY_RULES' || upper.startsWith('INSERT INTO SALARY_RULES') || upper.startsWith('UPDATE SALARY_RULES') || upper.startsWith('DELETE FROM SALARY_RULES')) {
      if (upper.startsWith('INSERT INTO SALARY_RULES')) {
        const nextId = this.state.salary_rules.length > 0
          ? Math.max(...this.state.salary_rules.map(r => r.id)) + 1
          : 1;
        const newRule = {
          id: nextId,
          salary_structure_id: parseInt(params[0], 10),
          name: params[1],
          code: params[2],
          category: params[3],
          sequence: parseInt(params[4], 10) || 10,
          computation_type: params[5] || 'fixed',
          amount: parseFloat(params[6]) || 0,
          percentage: parseFloat(params[7]) || 0,
          formula: params[8] || null,
          base_rule_id: params[9] ? parseInt(params[9], 10) : null,
          is_active: params[10] !== undefined ? Boolean(params[10]) : true,
          is_taxable: params[11] !== undefined ? Boolean(params[11]) : true,
          notes: params[12] || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.state.salary_rules.push(newRule);
        this.save();
        return { rows: [newRule], rowCount: 1 };
      }

      if (upper.startsWith('UPDATE SALARY_RULES')) {
        const rId = parseInt(params[params.length - 1], 10);
        const rule = this.state.salary_rules.find(r => r.id === rId);
        if (rule) {
          if (upper.includes('SEQUENCE = $1') && params.length === 3) {
            rule.sequence = parseInt(params[0], 10);
          } else {
            if (params[0]) rule.name = params[0];
            if (params[1]) rule.code = params[1];
            if (params[2]) rule.category = params[2];
            if (params[3] !== null && params[3] !== undefined) rule.sequence = parseInt(params[3], 10);
            if (params[4]) rule.computation_type = params[4];
            if (params[5] !== null && params[5] !== undefined) rule.amount = parseFloat(params[5]);
            if (params[6] !== null && params[6] !== undefined) rule.percentage = parseFloat(params[6]);
            if (params[7] !== undefined) rule.formula = params[7];
            if (params[8] !== undefined) rule.base_rule_id = params[8];
            if (params[9] !== undefined && params[9] !== null) rule.is_active = Boolean(params[9]);
            if (params[10] !== undefined && params[10] !== null) rule.is_taxable = Boolean(params[10]);
            if (params[11] !== undefined) rule.notes = params[11];
          }
          rule.updated_at = new Date().toISOString();
          this.save();
          return { rows: [rule], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (upper.startsWith('DELETE FROM SALARY_RULES')) {
        const rId = parseInt(params[0], 10);
        this.state.salary_rules = this.state.salary_rules.filter(r => r.id !== rId);
        this.save();
        return { rows: [], rowCount: 1 };
      }

      let list = this.state.salary_rules.slice();
      if (params.length > 0 && (upper.includes('WHERE R.SALARY_STRUCTURE_ID = $1') || upper.includes('WHERE SALARY_STRUCTURE_ID = $1'))) {
        const sid = parseInt(params[0], 10);
        list = list.filter(r => r.salary_structure_id === sid);
      }
      if (upper.includes('WHERE R.ID = $1') || upper.includes('WHERE ID = $1')) {
        const rId = parseInt(params[0], 10);
        list = list.filter(r => r.id === rId);
      }

      list.sort((a, b) => a.sequence - b.sequence);
      return { rows: list, rowCount: list.length };
    }

    // 3. EMPLOYEES
    if (primaryTable === 'EMPLOYEES') {
      if (upper.startsWith('SELECT COUNT(')) {
        return {
          rows: [{
            total_employees: this.state.employees.length,
            active_astronauts: this.state.employees.filter(e => e.status === 'Active').length,
            onboarding_crew: this.state.employees.filter(e => e.status === 'Onboarding').length,
            on_leave_crew: this.state.employees.filter(e => e.status === 'On-Leave').length,
            suspended_crew: this.state.employees.filter(e => e.status === 'Suspended').length,
            avg_salary: Math.round(this.state.employees.reduce((acc, e) => acc + (parseFloat(e.base_salary) || 0), 0) / (this.state.employees.length || 1)),
          }],
          rowCount: 1,
        };
      }

      // Check for single employee query
      if (upper.includes('WHERE E.ID = $1') || upper.includes('WHERE E.ID =') || upper.includes('WHERE ID = $1')) {
        const idVal = params[0];
        const emp = this.state.employees.find(e => e.id == idVal || e.employee_id == idVal);
        if (!emp) return { rows: [], rowCount: 0 };

        const dept = this.state.departments.find(d => d.id === emp.department_id);
        const role = this.state.roles.find(r => r.id === emp.role_id);
        const mgr = emp.manager_id ? this.state.employees.find(m => m.id === emp.manager_id) : null;

        return {
          rows: [{
            ...emp,
            full_name: `${emp.first_name} ${emp.last_name}`,
            department_name: dept ? dept.name : null,
            department_code: dept ? dept.code : null,
            orbital_deck: dept ? dept.orbital_deck : null,
            role_title: role ? role.title : null,
            role_clearance: role ? role.clearance_level : null,
            manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : null,
            manager_email: mgr ? mgr.email : null,
          }],
          rowCount: 1,
        };
      }

      // Manager reports
      if (upper.includes('WHERE MANAGER_ID = $1')) {
        const mgrId = params[0];
        const reports = this.state.employees.filter(e => e.manager_id == mgrId);
        return { rows: reports, rowCount: reports.length };
      }

      // All employees list
      let list = this.state.employees.map(emp => {
        const dept = this.state.departments.find(d => d.id === emp.department_id);
        const role = this.state.roles.find(r => r.id === emp.role_id);
        const mgr = emp.manager_id ? this.state.employees.find(m => m.id === emp.manager_id) : null;
        return {
          ...emp,
          full_name: `${emp.first_name} ${emp.last_name}`,
          department_name: dept ? dept.name : null,
          department_code: dept ? dept.code : null,
          orbital_deck: dept ? dept.orbital_deck : null,
          role_title: role ? role.title : null,
          role_clearance: role ? role.clearance_level : null,
          manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : null,
          manager_email: mgr ? mgr.email : null,
          manager_position: mgr ? mgr.job_position : null,
          total_compensation: (parseFloat(emp.base_salary) || 0) + (parseFloat(emp.gravity_allowance) || 0),
        };
      });

      return { rows: list, rowCount: list.length };
    }

    // 2. DEPARTMENTS
    if (upper.includes('FROM DEPARTMENTS')) {
      const depts = this.state.departments.map(d => ({
        ...d,
        active_members: this.state.employees.filter(e => e.department_id === d.id).length,
      }));
      return { rows: depts, rowCount: depts.length };
    }

    // 3. ROLES
    if (upper.includes('FROM ROLES')) {
      return { rows: this.state.roles, rowCount: this.state.roles.length };
    }

    // 4. CONTRACTS
    if (upper.includes('FROM CONTRACTS')) {
      const list = this.state.contracts.map(c => {
        const emp = this.state.employees.find(e => e.id === c.employee_id);
        const dept = emp ? this.state.departments.find(d => d.id === emp.department_id) : null;
        return {
          ...c,
          emp_code: emp ? emp.employee_id : null,
          first_name: emp ? emp.first_name : null,
          last_name: emp ? emp.last_name : null,
          full_name: emp ? `${emp.first_name} ${emp.last_name}` : null,
          avatar_url: emp ? emp.avatar_url : null,
          job_position: emp ? emp.job_position : null,
          department_name: dept ? dept.name : null,
          total_compensation: (parseFloat(c.base_salary) || 0) + (parseFloat(c.gravity_allowance) || 0),
        };
      });
      return { rows: list, rowCount: list.length };
    }

    // 5. WORKING SCHEDULES
    if (upper.includes('FROM WORKING_SCHEDULES')) {
      const list = this.state.working_schedules.map(s => {
        const emp = this.state.employees.find(e => e.id === s.employee_id);
        return {
          ...s,
          first_name: emp ? emp.first_name : null,
          last_name: emp ? emp.last_name : null,
          full_name: emp ? `${emp.first_name} ${emp.last_name}` : null,
        };
      });
      return { rows: list, rowCount: list.length };
    }

    // 6. ATTENDANCE LOGS
    if (upper.includes('FROM ATTENDANCE_LOGS')) {
      return { rows: this.state.attendance_logs, rowCount: this.state.attendance_logs.length };
    }

    // 7. TIME OFF
    if (upper.includes('FROM TIME_OFF_TYPES')) {
      return { rows: this.state.time_off_types, rowCount: this.state.time_off_types.length };
    }
    if (upper.includes('FROM TIME_OFF_ALLOCATIONS')) {
      return { rows: this.state.time_off_allocations, rowCount: this.state.time_off_allocations.length };
    }
    if (upper.includes('FROM TIME_OFF_REQUESTS')) {
      return { rows: this.state.time_off_requests, rowCount: this.state.time_off_requests.length };
    }

    // 10. TELEMETRY LOGS
    if (upper.includes('FROM PROPULSION_TELEMETRY_LOGS')) {
      return {
        rows: [
          {
            id: 1,
            event_type: 'WARP_QUERY_FAILOVER',
            route: '/api/salary-structures',
            method: 'GET',
            status_code: 200,
            execution_time_ms: 1.25,
            quantum_pool_active: 1,
            quantum_pool_idle: 9,
            thrust_score: 99.8,
            client_ip: '127.0.0.1',
            user_clearance: 'Level-5 Fleet Admiral',
            details: { module: 'quantum-salary-structuring', status: 'optimal' },
            created_at: new Date().toISOString(),
          }
        ],
        rowCount: 1,
      };
    }

    return { rows: [], rowCount: 0 };
  }
}

const memoryStore = new QuantumMemoryAdapter();
module.exports = memoryStore;

