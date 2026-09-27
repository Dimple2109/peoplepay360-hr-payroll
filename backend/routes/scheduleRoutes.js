// ====================================================================
// Working Schedule Routes — /api/working-schedules
// /orbital-schedule-engine: Weekly shift pattern management
// ====================================================================

const express = require('express');
const router = express.Router();
const {
  getAllSchedules,
  getScheduleById,
  getActiveScheduleForEmployee,
  getEmployeeScheduleHistory,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');

// GET    /api/working-schedules                          — list all
router.get('/', getAllSchedules);

// GET    /api/working-schedules/:id                      — single schedule
router.get('/:id', getScheduleById);

// GET    /api/working-schedules/active/:employeeId       — active schedule for employee
router.get('/active/:employeeId', getActiveScheduleForEmployee);

// GET    /api/working-schedules/employee/:employeeId/history — full schedule history
router.get('/employee/:employeeId/history', getEmployeeScheduleHistory);

// POST   /api/working-schedules                          — create schedule
router.post('/', createSchedule);

// PUT    /api/working-schedules/:id                      — update schedule
router.put('/:id', updateSchedule);

// DELETE /api/working-schedules/:id                      — remove schedule
router.delete('/:id', deleteSchedule);

module.exports = router;
