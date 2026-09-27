// ====================================================================
// PeoplePay360: Anti-Gravity Operational Core
// Express Server with:
//  - /quantum-database-pooling
//  - /levitation-auth-middleware
//  - /propulsion-logging
// ====================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const quantumPool = require('./config/quantumPool');
const { levitationAuth } = require('./middleware/levitationAuth');
const { propulsionLogger } = require('./middleware/propulsionLogger');

const employeeRoutes  = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes      = require('./routes/roleRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const contractRoutes  = require('./routes/contractRoutes');
const scheduleRoutes  = require('./routes/scheduleRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');  // /orbital-attendance-sync & /gravity-exception-detector
const timeOffRoutes   = require('./routes/timeOffRoutes');     // /zero-g-timeoff-allocator
const salaryStructureRoutes = require('./routes/salaryStructureRoutes'); // /quantum-salary-structuring
const salaryRuleRoutes      = require('./routes/salaryRuleRoutes');      // /gravitational-rule-engine & /warp-computation-matrix
const payrunRoutes          = require('./routes/payrunRoutes');          // /orbital-payrun-wizard & /quantum-payslip-engine
const payslipRoutes         = require('./routes/payslipRoutes');         // /teleport-pdf-disbursal
const dashboardRoutes       = require('./routes/dashboardRoutes');       // /stellar-payroll-dashboard

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  exposedHeaders: ['X-Levitation-Status', 'X-Clearance-Tier', 'X-Gravitational-Shield'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// /propulsion-logging middleware (tracks all routes in real-time)
app.use(propulsionLogger);

// /levitation-auth-middleware (frictionless RBAC injection)
app.use(levitationAuth);

// API Endpoints
app.use('/api/employees',         employeeRoutes);
app.use('/api/departments',        departmentRoutes);
app.use('/api/roles',              roleRoutes);
app.use('/api/telemetry',          telemetryRoutes);
app.use('/api/contracts',          contractRoutes);          // /temporal-contract-sync
app.use('/api/working-schedules',  scheduleRoutes);          // /orbital-schedule-engine
app.use('/api/attendance',         attendanceRoutes);        // /orbital-attendance-sync & /gravity-exception-detector
app.use('/api/time-off',           timeOffRoutes);           // /zero-g-timeoff-allocator
app.use('/api/salary-structures',  salaryStructureRoutes);   // /quantum-salary-structuring
app.use('/api/salary-rules',       salaryRuleRoutes);        // /gravitational-rule-engine & /warp-computation-matrix
app.use('/api/payruns',            payrunRoutes);            // /orbital-payrun-wizard & /quantum-payslip-engine
app.use('/api/payslips',           payslipRoutes);           // /teleport-pdf-disbursal
app.use('/api/dashboard',          dashboardRoutes);         // /stellar-payroll-dashboard

// Orbital Health & Quantum Pool Diagnostic
app.get('/api/health', (req, res) => {
  const poolTelemetry = quantumPool.getTelemetry();
  res.json({
    status: 'ACTIVE_ANTI_GRAVITY',
    service: 'PeoplePay360 Core HR & Payroll Engine',
    operationalMode: 'WARP_SYNCHRONIZED',
    timestamp: new Date().toISOString(),
    callerClearance: req.user?.clearanceLevel || 'Cadet',
    quantumPool: poolTelemetry,
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PeoplePay360 Anti-Gravity HR & Payroll Platform API',
    version: '1.0.0-ORBITAL',
    documentation: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Orbital Coordinate Not Found (404)',
    route: req.originalUrl,
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED-PROPULSION-FAULT]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Gravitational Inversion Fault',
    message: err.message,
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`
  ======================================================
  🛸 PEOPLEPAY360 ANTI-GRAVITY HR & PAYROLL API ONLINE
  ======================================================
  • Port:                   http://localhost:${PORT}
  • Health & Pool Check:    http://localhost:${PORT}/api/health
  • Employee Master API:    http://localhost:${PORT}/api/employees
  • Contract Mgmt API:      http://localhost:${PORT}/api/contracts
  • Working Schedules API:  http://localhost:${PORT}/api/working-schedules
  • Orbital Attendance API: http://localhost:${PORT}/api/attendance
  • Zero-G Time Off API:    http://localhost:${PORT}/api/time-off
  • Salary Structures API:  http://localhost:${PORT}/api/salary-structures
  • Salary Rules API:        http://localhost:${PORT}/api/salary-rules
  • Orbital Payruns API:    http://localhost:${PORT}/api/payruns
  • Teleport Payslips API:  http://localhost:${PORT}/api/payslips
  • Stellar Dashboard API:  http://localhost:${PORT}/api/dashboard/payroll-metrics
  • Real-time Telemetry:    http://localhost:${PORT}/api/telemetry
  • PostgreSQL Port:        ${process.env.PGPORT || 5433}
  • Quantum Pool Status:    SUPERCONDUCTING
  • Levitation RBAC:        ACTIVE
  • Quantum Salary Struct:  ACTIVE (/quantum-salary-structuring)
  • Gravitational Rule Eng: SEQUENCING (/gravitational-rule-engine)
  • Warp Computation Mat:   CALIBRATED (/warp-computation-matrix)
  • Orbital Payrun Wizard:  READY (/orbital-payrun-wizard)
  • Quantum Payslip Engine: CALIBRATED (/quantum-payslip-engine)
  • Teleport PDF Disbursal: ARMED (/teleport-pdf-disbursal)
  • Stellar Payroll Dash:   ONLINE (/stellar-payroll-dashboard)
  • Temporal Contract Sync: ARMED
  • Orbital Schedule Eng:   CALIBRATED
  • Orbital Attendance Sync:ARMED
  • Zero-G TimeOff Alloc:   ONLINE
  • Gravity Exception Det:  ENGAGED
  ======================================================
  `);
});

// Graceful Termination
process.on('SIGTERM', async () => {
  console.log('[SHUTDOWN] Disengaging anti-gravity thrusters...');
  server.close(async () => {
    await quantumPool.end();
    console.log('[SHUTDOWN] Quantum pool offline. Safe orbital decay.');
    process.exit(0);
  });
});

module.exports = app;
