// ====================================================================
// PeoplePay360: Salary Rule Controller
// /gravitational-rule-engine  — Ordered Rule Sequencing (Basic -> Allowance -> Gross -> Deduction -> Net)
// /warp-computation-matrix    — Fixed, Percentage & Formula Calculus
// ====================================================================

const { salaryService, inspectFormula, CATEGORY_ORDER } = require('../services/salaryService');

/**
 * GET /api/salary-rules
 * Retrieve list of rules with filtering by structure, category, status
 */
async function getAllRules(req, res) {
  try {
    const { salary_structure_id, category, is_active, search } = req.query;
    const rules = await salaryService.getRules({ salary_structure_id, category, is_active, search });

    return res.json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    console.error('[SALARY-RULE] getAllRules error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orbital salary rules',
      details: error.message,
    });
  }
}

/**
 * GET /api/salary-rules/:id
 * Retrieve single rule details
 */
async function getRuleById(req, res) {
  try {
    const { id } = req.params;
    const rule = await salaryService.getRuleById(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: `Salary rule #${id} not found in orbital registry`,
      });
    }

    return res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error fetching salary rule',
      details: error.message,
    });
  }
}

/**
 * POST /api/salary-rules
 * Create a new salary rule with gravitational sequence enforcement
 */
async function createRule(req, res) {
  try {
    const {
      salary_structure_id,
      name,
      code,
      category,
      sequence,
      computation_type,
      amount,
      percentage,
      formula,
      base_rule_id,
      is_active,
      is_taxable,
      notes,
    } = req.body;

    if (!salary_structure_id || !name || !code || !category) {
      return res.status(400).json({
        success: false,
        error: 'salary_structure_id, name, code, and category are required',
      });
    }

    const created = await salaryService.createRule({
      salary_structure_id,
      name,
      code,
      category,
      sequence,
      computation_type,
      amount,
      percentage,
      formula,
      base_rule_id,
      is_active,
      is_taxable,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: `Salary Rule [${created.code}] successfully linked to structure`,
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
 * PUT /api/salary-rules/:id
 * Update an existing salary rule
 */
async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const updated = await salaryService.updateRule(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Salary rule #${id} not found for update`,
      });
    }

    return res.json({
      success: true,
      message: `Salary Rule [${updated.code}] recalibrated`,
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
 * DELETE /api/salary-rules/:id
 * Delete a salary rule
 */
async function deleteRule(req, res) {
  try {
    const { id } = req.params;
    const success = await salaryService.deleteRule(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Salary rule #${id} not found for deletion`,
      });
    }

    return res.json({
      success: true,
      message: `Salary rule #${id} decommissioned`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * PATCH /api/salary-rules/reorder
 * Bulk reorder rules within a structure
 */
async function reorderRules(req, res) {
  try {
    const { salary_structure_id, reordered_rules } = req.body;

    if (!salary_structure_id || !Array.isArray(reordered_rules)) {
      return res.status(400).json({
        success: false,
        error: 'salary_structure_id and an array of reordered_rules [{id, sequence}] are required',
      });
    }

    const rules = await salaryService.reorderRules(salary_structure_id, reordered_rules);

    return res.json({
      success: true,
      message: 'Rule execution order updated in /gravitational-rule-engine',
      data: rules,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * POST /api/salary-rules/validate-formula
 * /warp-computation-matrix: Inspect and validate custom space formula
 */
async function validateFormula(req, res) {
  try {
    const { formula, context_variables = [] } = req.body;

    if (!formula || typeof formula !== 'string') {
      return res.json({
        success: true,
        valid: true,
        variables: [],
        message: 'Empty formula is valid (evaluates to 0)',
      });
    }

    const inspection = inspectFormula(formula);

    return res.json({
      success: true,
      valid: inspection.valid,
      variables: inspection.variables,
      error: inspection.error || null,
      message: inspection.valid
        ? `Formula valid. Resolves ${inspection.variables.length} variable(s): ${inspection.variables.join(', ')}`
        : `Syntax error: ${inspection.error}`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  reorderRules,
  validateFormula,
};
