const express = require('express');
const router = express.Router();
const {
  getReminders,
  getPendingReminders,
  createReminder,
  markReminderSent,
  deleteReminder
} = require('../controllers/reminderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getReminders);
router.get('/pending', verifyToken, getPendingReminders);
router.post('/', verifyToken, createReminder);
router.put('/:id/sent', verifyToken, markReminderSent);
router.delete('/:id', verifyToken, isAdmin, deleteReminder);

module.exports = router;