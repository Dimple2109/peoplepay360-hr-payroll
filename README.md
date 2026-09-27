# PeoplePay360: Anti-Gravity HR & Payroll Platform

PeoplePay360 is a futuristic HR & Payroll operating system integrated with advanced Anti-Gravity operational concepts.

## Tech Stack
- **Backend**: Node.js, Express, PostgreSQL 18
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL (`peoplepay360`)

## Anti-Gravity Operational Skills
- `/zero-gravity-state-management`: Floating, weightless UI components, smooth optimistic status transitions, and Kanban drag mechanics.
- `/quantum-database-pooling`: PostgreSQL connection pool wrapper with microsecond latency profiling and superconducting status.
- `/levitation-auth-middleware`: Role-based access control with clearance tiering (`Level-1 Cadet` to `Level-5 Fleet Admiral`).
- `/propulsion-logging`: Real-time system performance telemetry and circular activity buffer.
- `/quantum-salary-structuring`: Containerized salary structure modeling (e.g. Regular Orbital Salary, Executive Warp-Tier, Deep Space Mission Pay) with active rule mapping, versioning, and crew allocations.
- `/gravitational-rule-engine`: Monotonic ordered sequence execution (Basic ➔ Allowances ➔ Gross ➔ Deductions ➔ Net) with cycle detection and reordering.
- `/warp-computation-matrix`: Multi-mode compensation calculus engine supporting fixed amounts, percentages, and custom space formulas with sandboxed expression evaluation and real-time execution trace.

## Quick Start

### 1. Database Setup
```powershell
# Run migrations and seed data
cd backend
npm run db:migrate
```

### 2. Backend Server
```powershell
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. Frontend Dashboard
```powershell
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

## Features Implemented

### Turn 1
1. **Employee Master Directory**: Full CRUD with relational joins for departments, roles, managers, flight schedules, and statuses.
2. **Dual View Layouts**: Matrix List Grid and Zero-G Kanban Pipeline.
3. **Enroll Astronaut Modal**: Complete multi-section modal for creating and recalibrating records.
4. **Orbital Dossier Drawer**: Slide-out credentials inspection showing hierarchy and compensation breakdown.
5. **Live Telemetry HUD**: Expandable bottom ticker tracking live query propulsion and connection pool health.
6. **Contracts & Working Schedules**: `/temporal-contract-sync` and `/orbital-schedule-engine`.

### Turn 2 (Salary Structure & Salary Rule Configuration)
1. **Database Schema Additions (PostgreSQL)**:
   - `salary_structures`: id, code, name, description, wage_type (`monthly`, `hourly`, `mission`), company_contribution, is_active, currency, version, notes, timestamps.
   - `salary_rules`: id, salary_structure_id, name, code, category (`basic`, `allowance`, `gross`, `deduction`, `net`), sequence, computation_type (`fixed`, `percentage`, `formula`), amount, percentage, formula, base_rule_id, is_active, is_taxable, notes, timestamps.
   - `v_salary_structure_summary`: Aggregated view calculating total rules, breakdown counts, and assigned active contracts.
2. **Backend API Endpoints (`/api/salary-structures` & `/api/salary-rules`)**:
   - `GET /api/salary-structures`: List all structures with filters, rule counts, and employee count.
   - `GET /api/salary-structures/stats`: Aggregate KPIs for structures and rules.
   - `GET /api/salary-structures/:id`: Get single structure with all ordered rules.
   - `POST /api/salary-structures`: Create containerized structure.
   - `PUT /api/salary-structures/:id`: Update structure and increment version.
   - `PATCH /api/salary-structures/:id/status`: Toggle active status.
   - `DELETE /api/salary-structures/:id`: Cascade decommission structure.
   - `POST /api/salary-structures/:id/duplicate`: Deep clone structure with all rules.
   - `POST /api/salary-structures/:id/calculate`: Dynamic sequential calculation simulation.
   - `GET /api/salary-rules`: Filterable list of rules.
   - `GET /api/salary-rules/:id`: Single rule details.
   - `POST /api/salary-rules`: Create rule with sequence and category validation.
   - `PUT /api/salary-rules/:id`: Update rule attributes and formulas.
   - `PATCH /api/salary-rules/reorder`: Bulk sequence recalibration.
   - `POST /api/salary-rules/validate-formula`: Live space formula syntax and variable analysis.
   - `DELETE /api/salary-rules/:id`: Remove rule from sequence.
3. **Frontend Operational Views (React + Tailwind)**:
   - **Salary Structure Management**: Dual card and matrix views, status toggling, quick search, wage type filters, duplication, creation/editing modals.
   - **Gravitational Rule Engine View**: Visual trajectory flow banner (`Basic` ➔ `Allowances` ➔ `Gross` ➔ `Deductions` ➔ `Net`), interactive sequence ordering (Move Up/Down), formula editor with syntax highlighter and clickable variables.
   - **Warp Computation Matrix Simulator**: Interactive playground to input annual base salary, gravity allowance, days worked, and overtime hours, generating an execution trace and net disbursable breakdown.

