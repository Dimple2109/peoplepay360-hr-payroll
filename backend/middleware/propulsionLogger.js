// ====================================================================
// /propulsion-logging
// Real-time system performance tracking with microsecond velocity metrics,
// thrust calculations, in-memory telemetry ring buffer, and db persistence
// ====================================================================

const quantumPool = require('../config/quantumPool');

const MAX_RING_BUFFER = 100;
const propulsionRingBuffer = [];

let totalRequests = 0;
let totalLatencyMs = 0;
let peakLatencyMs = 0;

/**
 * Express middleware for propulsion logging
 */
function propulsionLogger(req, res, next) {
  const startHrTime = process.hrtime.bigint();
  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const endHrTime = process.hrtime.bigint();
    const durationMs = parseFloat((Number(endHrTime - startHrTime) / 1e6).toFixed(2));

    totalRequests += 1;
    totalLatencyMs += durationMs;
    if (durationMs > peakLatencyMs) {
      peakLatencyMs = durationMs;
    }

    // Dynamic thrust calculation (0 to 100 score based on velocity < 50ms is top tier)
    const thrustScore = parseFloat(Math.max(70, Math.min(100, 100 - (durationMs * 0.25))).toFixed(1));

    // Telemetry entry
    const entry = {
      id: `PROP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      route: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      durationMs,
      thrustScore,
      userClearance: req.user?.clearanceLevel || 'Guest/Cadet',
      ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
      poolTelemetry: quantumPool.getTelemetry(),
    };

    // Add to in-memory circular telemetry buffer
    propulsionRingBuffer.unshift(entry);
    if (propulsionRingBuffer.length > MAX_RING_BUFFER) {
      propulsionRingBuffer.pop();
    }

    // Async write to database log without blocking response
    if (process.env.PROPULSION_TELEMETRY_ENABLED !== 'false' && !req.originalUrl.includes('/telemetry/stream')) {
      quantumPool.query(
        `INSERT INTO propulsion_telemetry_logs 
          (event_type, route, method, status_code, execution_time_ms, quantum_pool_active, quantum_pool_idle, thrust_score, client_ip, user_clearance, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          'HTTP_PROPULSION',
          entry.route,
          entry.method,
          entry.statusCode,
          durationMs,
          entry.poolTelemetry.activeConnections,
          entry.poolTelemetry.idleConnections,
          thrustScore,
          entry.ip,
          entry.userClearance,
          JSON.stringify({ query: req.query, params: req.params }),
        ]
      ).catch((err) => {
        // Suppress non-critical logging errors
      });
    }
  });

  next();
}

/**
 * Returns aggregated propulsion telemetry for live HUD
 */
function getPropulsionTelemetry() {
  const avgLatency = totalRequests > 0 ? (totalLatencyMs / totalRequests).toFixed(2) : '0.00';
  const poolStats = quantumPool.getTelemetry();

  return {
    totalRequests,
    avgLatencyMs: parseFloat(avgLatency),
    peakLatencyMs: parseFloat(peakLatencyMs.toFixed(2)),
    systemThrustRating: poolStats.thrustScore,
    quantumPool: poolStats,
    recentPulses: propulsionRingBuffer.slice(0, 15),
    operationalStatus: 'WARP_READY_NOMINAL',
    serverTimestamp: new Date().toISOString(),
  };
}

module.exports = {
  propulsionLogger,
  getPropulsionTelemetry,
};
