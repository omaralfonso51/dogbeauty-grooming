const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, getDashboard);

module.exports = router;