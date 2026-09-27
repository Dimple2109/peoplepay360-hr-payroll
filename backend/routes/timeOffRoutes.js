// ====================================================================
// Time Off Management Routes
// /zero-g-timeoff-allocator
// ====================================================================

const express = require('express');
const router = express.Router();
const timeOffController = require('../controllers/timeOffController');

// 1. Time off policy types
router.get('/types',                       timeOffController.getAllTypes);
router.post('/types',                      timeOffController.createType);

// 2. Allocations & balances
router.get('/allocations',                 timeOffController.getAllocations);
router.get('/allocations/:employeeId/summary', timeOffController.getEmployeeAllocationSummary);
router.post('/allocations',                timeOffController.setAllocation);

// 3. Operational KPIs
router.get('/stats',                       timeOffController.getTimeOffStats);

// 4. Requests & Approval Workflow
router.get('/requests',                    timeOffController.getAllRequests);
router.post('/requests',                   timeOffController.createRequest);
router.patch('/requests/:id/approve',      timeOffController.approveRequest);
router.patch('/requests/:id/refuse',       timeOffController.refuseRequest);
router.delete('/requests/:id',             timeOffController.deleteRequest);

module.exports = router;
