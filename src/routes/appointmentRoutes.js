const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  completeAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getAppointments);
router.get('/:id', verifyToken, getAppointmentById);
router.post('/', verifyToken, createAppointment);
router.put('/:id', verifyToken, updateAppointment);
router.put('/:id/complete', verifyToken, completeAppointment);
router.put('/:id/cancel', verifyToken, cancelAppointment);

module.exports = router;