const express = require('express');
const router = express.Router();
const { getOwners, getOwnerById, createOwner, updateOwner, deleteOwner } = require('../controllers/ownerController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getOwners);
router.get('/:id', verifyToken, getOwnerById);
router.post('/', verifyToken, createOwner);
router.put('/:id', verifyToken, updateOwner);
router.delete('/:id', verifyToken, isAdmin, deleteOwner);

module.exports = router;