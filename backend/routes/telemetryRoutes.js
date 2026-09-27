// ====================================================================
// Telemetry Routes
// Exposes real-time system performance tracking, quantum pool health,
// and historical thrust logs
// ====================================================================

const express = require('express');
const router = express.Router();
const quantumPool = require('../config/quantumPool');
const { getPropulsionTelemetry } = require('../middleware/propulsionLogger');

/**
 * Live propulsion metrics and pool status
 */
router.get('/', (req, res) => {
  const telemetry = getPropulsionTelemetry();
  return res.json({
    success: true,
    data: telemetry,
  });
});

/**
 * Historical telemetry logs from PostgreSQL
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '25', 10);
    const query = `
      SELECT * FROM propulsion_telemetry_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const { rows, thrustLatencyMs } = await quantumPool.query(query, [limit]);

    return res.json({
      success: true,
      data: rows,
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Simulate or re-seed database if needed
 */
router.post('/reseed', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    await quantumPool.query(seedSql);

    return res.json({
      success: true,
      message: 'Orbital database re-seeded to nominal state',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
