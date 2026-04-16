const express = require('express');
const router = express.Router();
const { getCuts, getCutById, createCut, updateCut, deleteCut } = require('../controllers/cutController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getCuts);
router.get('/:id', verifyToken, getCutById);
router.post('/', verifyToken, isAdmin, createCut);
router.put('/:id', verifyToken, isAdmin, updateCut);
router.delete('/:id', verifyToken, isAdmin, deleteCut);

module.exports = router;