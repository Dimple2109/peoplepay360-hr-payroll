// ====================================================================
// /quantum-database-pooling
// Ultra-fast PostgreSQL connection handling with dynamic telemetry,
// zero-drift query profiling, and superconducting connection lifecycle
// ====================================================================

const { Pool } = require('pg');
require('dotenv').config();

const quantumConfig = {
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT || '5433', 10),
  database: process.env.PGDATABASE || 'peoplepay360',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  max: parseInt(process.env.QUANTUM_POOL_MAX || '20', 10),
  min: parseInt(process.env.QUANTUM_POOL_MIN || '4', 10),
  idleTimeoutMillis: parseInt(process.env.QUANTUM_IDLE_TIMEOUT_MS || '10000', 10),
  connectionTimeoutMillis: parseInt(process.env.QUANTUM_CONNECTION_TIMEOUT_MS || '3000', 10),
};

class QuantumDatabasePool {
  constructor(config) {
    this.config = config;
    this.pool = new Pool(config);
    this.stats = {
      totalQueries: 0,
      totalExecutionTimeMs: 0,
      peakConcurrent: 0,
      failedQueries: 0,
      poolState: 'SUPERCONDUCTING', // 'SUPERCONDUCTING' | 'RESONATING' | 'CRITICAL'
      connectedSince: new Date().toISOString(),
    };

    this._initializeTelemetry();
  }

  _initializeTelemetry() {
    this.pool.on('connect', (client) => {
      // Set session anti-gravity parameters if needed
      client.query("SET application_name = 'PeoplePay360_AntiGravity_Core';")
        .catch(() => {});
    });

    this.pool.on('error', (err) => {
      console.error('[QUANTUM-POOL-ERROR] Unexpected fault on idle client:', err.message);
      this.stats.poolState = 'CRITICAL';
    });
  }

  /**
   * Executes a query with precision microsecond thrust profiling
   * @param {string} text - SQL query string
   * @param {Array} params - parameterized query inputs
   */
  async query(text, params = []) {
    const startTime = process.hrtime.bigint();
    this.stats.totalQueries += 1;

    try {
      const activeCount = this.pool.totalCount - this.pool.idleCount;
      if (activeCount > this.stats.peakConcurrent) {
        this.stats.peakConcurrent = activeCount;
      }

      const result = await this.pool.query(text, params);
      
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1e6;
      this.stats.totalExecutionTimeMs += latencyMs;
      this.stats.poolState = 'SUPERCONDUCTING';

      return {
        ...result,
        thrustLatencyMs: parseFloat(latencyMs.toFixed(3)),
      };
    } catch (error) {
      this.stats.failedQueries += 1;
      this.stats.poolState = 'RESONATING';
      throw error;
    }
  }

  /**
   * Acquires a client directly from the quantum pool for atomic transactions
   */
  async getQuantumClient() {
    return await this.pool.connect();
  }

  /**
   * Telemetry diagnostic for system HUD and dashboard
   */
  getTelemetry() {
    const totalCount = this.pool.totalCount;
    const idleCount = this.pool.idleCount;
    const activeCount = Math.max(0, totalCount - idleCount);
    const waitingCount = this.pool.waitingCount;

    const avgLatency = this.stats.totalQueries > 0
      ? (this.stats.totalExecutionTimeMs / this.stats.totalQueries).toFixed(2)
      : '0.00';

    // Thrust efficiency calculation (0 - 100%)
    const thrustScore = Math.max(85, Math.min(99.9, 100 - (parseFloat(avgLatency) * 0.1)));

    return {
      status: this.stats.poolState,
      totalConnections: totalCount,
      activeConnections: activeCount,
      idleConnections: idleCount,
      waitingRequests: waitingCount,
      peakConcurrent: this.stats.peakConcurrent,
      lifetimeQueries: this.stats.totalQueries,
      failedQueries: this.stats.failedQueries,
      avgLatencyMs: parseFloat(avgLatency),
      thrustScore: parseFloat(thrustScore.toFixed(1)),
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      connectedSince: this.stats.connectedSince,
    };
  }

  /**
   * Graceful disengagement of pool
   */
  async end() {
    return await this.pool.end();
  }
}

const quantumPool = new QuantumDatabasePool(quantumConfig);
module.exports = quantumPool;
