const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, registerGroomer, getGroomers } = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/groomers', verifyToken, isAdmin, registerGroomer);
router.get('/groomers', verifyToken, getGroomers);



module.exports = router;