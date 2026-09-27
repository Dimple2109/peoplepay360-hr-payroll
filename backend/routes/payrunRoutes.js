// ====================================================================
// Payrun Routes
// /orbital-payrun-wizard & /quantum-payslip-engine
// ====================================================================

const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');

// Two-step payrun creation and list
router.get('/',                    payrunController.getAllPayruns);
router.post('/',                   payrunController.createPayrun);
router.get('/:id',                 payrunController.getPayrunById);
router.delete('/:id',              payrunController.deletePayrun);

// Processing & State Machine Endpoints
router.post('/:id/compute',        payrunController.computePayrun);     // /quantum-payslip-engine
router.post('/:id/validate',       payrunController.validatePayrun);    // Pre-flight checks
router.post('/:id/mark-paid',      payrunController.markPayrunPaid);    // Payment disbursement
router.post('/:id/send-emails',    payrunController.bulkSendEmails);    // /teleport-pdf-disbursal

module.exports = router;
