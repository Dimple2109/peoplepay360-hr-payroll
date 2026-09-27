// ====================================================================
// Payslip Routes
// /quantum-payslip-engine & /teleport-pdf-disbursal
// ====================================================================

const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');

router.get('/:id',                 payslipController.getPayslipById);
router.get('/:id/pdf',             payslipController.generatePayslipPdf);    // /teleport-pdf-disbursal printable PDF
router.post('/:id/send-email',     payslipController.sendSingleEmail);       // single email transmission

module.exports = router;
