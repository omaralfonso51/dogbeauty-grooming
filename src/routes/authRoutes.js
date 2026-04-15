const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

// Ejemplo de ruta protegida
router.get('/me', verifyToken, (req, res) => {
  res.json({ message: 'Ruta protegida', user: req.user });
});

module.exports = router;