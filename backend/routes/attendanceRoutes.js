// ====================================================================
// Attendance Routes
// /orbital-attendance-sync & /gravity-exception-detector
// ====================================================================

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Aggregate & Exception endpoints (placed before /:id)
router.get('/stats',           attendanceController.getAttendanceStats);
router.get('/exceptions',      attendanceController.getExceptions);

// Check-in and Check-out (/orbital-attendance-sync)
router.post('/check-in',       attendanceController.checkIn);
router.post('/check-out',      attendanceController.checkOut);

// Standard CRUD
router.get('/',                attendanceController.getAllAttendance);
router.get('/:id',             attendanceController.getAttendanceById);
router.post('/',               attendanceController.createManualAttendance);
router.put('/:id',             attendanceController.updateAttendance);
router.delete('/:id',          attendanceController.deleteAttendance);

module.exports = router;
