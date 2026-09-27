// ====================================================================
// Contract Routes — /api/contracts
// /temporal-contract-sync: Period-based versioning & status gating
// ====================================================================

const express = require('express');
const router = express.Router();
const {
  getAllContracts,
  getContractById,
  getActiveContractForEmployee,
  getEmployeeContractHistory,
  createContract,
  updateContract,
  deleteContract,
  activateContract,
} = require('../controllers/contractController');

// GET    /api/contracts                        — list all (filterable)
router.get('/', getAllContracts);

// GET    /api/contracts/:id                    — single contract detail
router.get('/:id', getContractById);

// GET    /api/contracts/active/:employeeId     — active contract for payroll engine
router.get('/active/:employeeId', getActiveContractForEmployee);

// GET    /api/contracts/employee/:employeeId/history — full contract history
router.get('/employee/:employeeId/history', getEmployeeContractHistory);

// POST   /api/contracts                        — create contract
router.post('/', createContract);

// PUT    /api/contracts/:id                    — update contract
router.put('/:id', updateContract);

// PATCH  /api/contracts/:id/activate           — activate contract (draft → active)
router.patch('/:id/activate', activateContract);

// DELETE /api/contracts/:id                    — decommission draft/historical contract
router.delete('/:id', deleteContract);

module.exports = router;
