// ====================================================================
// Payroll Dashboard Routes
// /stellar-payroll-dashboard
// ====================================================================

const express = require('express');
const router = express.Router();
const payrollDashboardController = require('../controllers/payrollDashboardController');

router.get('/payroll-metrics',     payrollDashboardController.getPayrollMetrics);

module.exports = router;
