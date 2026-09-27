// ====================================================================
// PeoplePay360: Salary Structure Routes — /api/salary-structures
// /quantum-salary-structuring — Containerized Salary Structures & Rule Mapping
// /gravitational-rule-engine  — Sequential Compensation Calculus
// ====================================================================

const express = require('express');
const router = express.Router();
const {
  getAllStructures,
  getStructureStats,
  getStructureById,
  createStructure,
  updateStructure,
  toggleStructureStatus,
  deleteStructure,
  duplicateStructure,
  calculateStructure,
} = require('../controllers/salaryStructureController');

// GET    /api/salary-structures/stats        — aggregate KPIs
router.get('/stats', getStructureStats);

// GET    /api/salary-structures              — list all structures (filterable)
router.get('/', getAllStructures);

// GET    /api/salary-structures/:id          — single structure with rules
router.get('/:id', getStructureById);

// POST   /api/salary-structures              — create new structure
router.post('/', createStructure);

// PUT    /api/salary-structures/:id          — update structure
router.put('/:id', updateStructure);

// PATCH  /api/salary-structures/:id/status   — toggle active status
router.patch('/:id/status', toggleStructureStatus);

// DELETE /api/salary-structures/:id          — decommission structure
router.delete('/:id', deleteStructure);

// POST   /api/salary-structures/:id/duplicate — clone structure with rules
router.post('/:id/duplicate', duplicateStructure);

// POST   /api/salary-structures/:id/calculate — /warp-computation-matrix simulation
router.post('/:id/calculate', calculateStructure);

module.exports = router;
