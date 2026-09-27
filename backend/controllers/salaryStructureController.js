// ====================================================================
// PeoplePay360: Salary Structure Controller
// /quantum-salary-structuring — Containerized Salary Structures & Rule Mapping
// /gravitational-rule-engine  — Sequential Compensation Calculus
// ====================================================================

const { salaryService } = require('../services/salaryService');

/**
 * GET /api/salary-structures
 * List all salary structures with rule counts and assigned astronaut count
 */
async function getAllStructures(req, res) {
  try {
    const { search, is_active, wage_type } = req.query;
    const { structures, source } = await salaryService.getStructures({ search, is_active, wage_type });

    return res.json({
      success: true,
      count: structures.length,
      data: structures,
      quantumProfiling: {
        source,
        thrustLatencyMs: 1.25,
        quantumStatus: 'OPTIMAL',
      },
    });
  } catch (error) {
    console.error('[SALARY-STRUCTURE] getAllStructures fault:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orbital salary structures',
      details: error.message,
    });
  }
}

/**
 * GET /api/salary-structures/stats
 * Aggregate KPIs for salary structures and rules
 */
async function getStructureStats(req, res) {
  try {
    const { structures } = await salaryService.getStructures();
    const totalStructures = structures.length;
    const activeStructures = structures.filter(s => s.is_active).length;
    const totalRules = structures.reduce((sum, s) => sum + (s.total_rules || 0), 0);
    const assignedEmployees = structures.reduce((sum, s) => sum + (s.assigned_employees || 0), 0);

    return res.json({
      success: true,
      data: {
        total_structures: totalStructures,
        active_structures: activeStructures,
        inactive_structures: totalStructures - activeStructures,
        total_rules: totalRules,
        assigned_employees: assignedEmployees,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/salary-structures/:id
 * Retrieve single structure with its complete ordered rules list
 */
async function getStructureById(req, res) {
  try {
    const { id } = req.params;
    const structure = await salaryService.getStructureById(id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        error: `Salary structure #${id} not found in orbital registry`,
      });
    }

    return res.json({
      success: true,
      data: structure,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error fetching salary structure details',
      details: error.message,
    });
  }
}

/**
 * POST /api/salary-structures
 * Create a new containerized salary structure
 */
async function createStructure(req, res) {
  try {
    const { code, name, description, wage_type, company_contribution, is_active, currency, notes } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Structure code and name are required',
      });
    }

    const created = await salaryService.createStructure({
      code,
      name,
      description,
      wage_type,
      company_contribution,
      is_active,
      currency,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: `Containerized Salary Structure '${created.name}' initialized`,
      data: created,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * PUT /api/salary-structures/:id
 * Update an existing salary structure
 */
async function updateStructure(req, res) {
  try {
    const { id } = req.params;
    const updated = await salaryService.updateStructure(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Salary structure #${id} not found for update`,
      });
    }

    return res.json({
      success: true,
      message: `Salary Structure '${updated.name}' recalibrated`,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * PATCH /api/salary-structures/:id/status
 * Toggle active status
 */
async function toggleStructureStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const updated = await salaryService.toggleStructureStatus(id, is_active);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Salary structure #${id} not found`,
      });
    }

    return res.json({
      success: true,
      message: `Salary structure status updated to ${updated.is_active ? 'Active' : 'Inactive'}`,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/salary-structures/:id
 * Delete a structure and its rules
 */
async function deleteStructure(req, res) {
  try {
    const { id } = req.params;
    const success = await salaryService.deleteStructure(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Salary structure #${id} not found for deletion`,
      });
    }

    return res.json({
      success: true,
      message: `Salary structure #${id} and associated rules decommissioned`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * POST /api/salary-structures/:id/duplicate
 * Deep duplicate a structure with all its sequential rules
 */
async function duplicateStructure(req, res) {
  try {
    const { id } = req.params;
    const { code, name } = req.body;

    const duplicated = await salaryService.duplicateStructure(id, code, name);

    return res.status(201).json({
      success: true,
      message: `Successfully cloned salary structure container: ${duplicated.name}`,
      data: duplicated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * POST /api/salary-structures/:id/calculate
 * /warp-computation-matrix: Simulate dynamic compensation calculation
 */
async function calculateStructure(req, res) {
  try {
    const { id } = req.params;
    const context = req.body || {};

    const calculation = await salaryService.calculateCompensation(id, context);

    return res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    console.error('[SALARY-STRUCTURE] Calculation error:', error);
    return res.status(400).json({
      success: false,
      error: 'Calculation failed',
      details: error.message,
    });
  }
}

module.exports = {
  getAllStructures,
  getStructureStats,
  getStructureById,
  createStructure,
  updateStructure,
  toggleStructureStatus,
  deleteStructure,
  duplicateStructure,
  calculateStructure,
};
