// ====================================================================
// Employee Routes
// Provides CRUD API routes for Employee Master Management
// Protected by /levitation-auth-middleware
// ====================================================================

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { requireClearance } = require('../middleware/levitationAuth');

// Query routes
router.get('/', employeeController.getAllEmployees);
router.get('/stats', employeeController.getEmployeeStats);
router.get('/:id', employeeController.getEmployeeById);

// Mutation routes (Clearance checked via levitation auth)
router.post('/', requireClearance('Level-2 Specialist'), employeeController.createEmployee);
router.put('/:id', requireClearance('Level-2 Specialist'), employeeController.updateEmployee);
router.patch('/:id/status', requireClearance('Level-2 Specialist'), employeeController.updateEmployeeStatus);
router.delete('/:id', requireClearance('Level-4 Commander'), employeeController.deleteEmployee);

module.exports = router;
