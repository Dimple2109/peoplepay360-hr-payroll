// ====================================================================
// PeoplePay360: Salary Rule Routes — /api/salary-rules
// /gravitational-rule-engine  — Sequential Compensation Calculus
// /warp-computation-matrix    — Fixed, Percentage & Custom Formulas
// ====================================================================

const express = require('express');
const router = express.Router();
const {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  reorderRules,
  validateFormula,
} = require('../controllers/salaryRuleController');

// POST   /api/salary-rules/validate-formula  — syntax & variables inspection
router.post('/validate-formula', validateFormula);

// PATCH  /api/salary-rules/reorder           — bulk reorder sequences
router.patch('/reorder', reorderRules);

// GET    /api/salary-rules                   — list all rules (filterable)
router.get('/', getAllRules);

// GET    /api/salary-rules/:id               — single rule detail
router.get('/:id', getRuleById);

// POST   /api/salary-rules                   — create new rule
router.post('/', createRule);

// PUT    /api/salary-rules/:id               — update rule
router.put('/:id', updateRule);

// DELETE /api/salary-rules/:id               — delete rule
router.delete('/:id', deleteRule);

module.exports = router;
