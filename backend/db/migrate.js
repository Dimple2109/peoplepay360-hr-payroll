const fs = require('fs');
const path = require('path');
const quantumPool = require('../config/quantumPool');

async function migrate() {
  console.log('[QUANTUM-MIGRATE] Initializing orbital schema & seed on PostgreSQL...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    console.log('[QUANTUM-MIGRATE] Applying schema definitions...');
    await quantumPool.query(schemaSql);

    console.log('[QUANTUM-MIGRATE] Seeding initial astronaut master registry...');
    await quantumPool.query(seedSql);

    console.log('[QUANTUM-MIGRATE] Quantum migration completed with 100% nominal thrust.');
    process.exit(0);
  } catch (error) {
    console.error('[QUANTUM-MIGRATE] Migration failure:', error);
    process.exit(1);
  }
}

migrate();
