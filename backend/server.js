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

const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');

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
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/telemetry', telemetryRoutes);

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
  • Real-time Telemetry:    http://localhost:${PORT}/api/telemetry
  • PostgreSQL Port:        ${process.env.PGPORT || 5433}
  • Quantum Pool Status:    SUPERCONDUCTING
  • Levitation RBAC:        ACTIVE
  • Propulsion Velocity:    CALIBRATED
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
