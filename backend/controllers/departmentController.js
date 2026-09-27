// ====================================================================
// Department Controller
// Retrieves orbital departments and head count targets
// ====================================================================

const quantumPool = require('../config/quantumPool');

async function getDepartments(req, res) {
  try {
    const query = `
      SELECT 
        d.*,
        COUNT(e.id) AS active_members
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id
      ORDER BY d.id ASC
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
  getDepartments,
};
