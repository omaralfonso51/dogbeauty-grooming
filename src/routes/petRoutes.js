const express = require('express');
const router = express.Router();
const { getPets, getPetById, createPet, updatePet, deletePet } = require('../controllers/petController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getPets);
router.get('/:id', verifyToken, getPetById);
router.post('/', verifyToken, createPet);
router.put('/:id', verifyToken, updatePet);
router.delete('/:id', verifyToken, isAdmin, deletePet);

module.exports = router;