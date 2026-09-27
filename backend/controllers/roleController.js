// ====================================================================
// Role Controller
// Manages orbital job roles, clearance tiers, and compensation bands
// ====================================================================

const quantumPool = require('../config/quantumPool');

async function getRoles(req, res) {
  try {
    const query = `
      SELECT 
        r.*,
        d.name AS department_name
      FROM roles r
      LEFT JOIN departments d ON r.department_id = d.id
      ORDER BY r.id ASC
    `;
    const { rows, thrustLatencyMs } = await quantumPool.query(query);

    return res.json({
      success: true,
      data: rows,
      quantumProfiling: { thrustLatencyMs },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getRoles,
};
