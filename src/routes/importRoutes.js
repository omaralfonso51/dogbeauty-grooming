const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importOwners, importPets, importCuts, importProducts } = require('../controllers/importController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Multer en memoria para CSV (no necesita Cloudinary)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

router.post('/owners', verifyToken, isAdmin, csvUpload.single('file'), importOwners);
router.post('/pets', verifyToken, isAdmin, csvUpload.single('file'), importPets);
router.post('/cuts', verifyToken, isAdmin, csvUpload.single('file'), importCuts);
router.post('/products', verifyToken, isAdmin, csvUpload.single('file'), importProducts);

module.exports = router;