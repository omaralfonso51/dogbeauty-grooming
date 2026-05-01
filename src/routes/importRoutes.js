const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  importOwners, importPets, importProducts, importCuts,
  undoImport, recoverImport, getBatches, getAuditLogs
} = require('../controllers/importController');
const { verifyToken, isAdmin } = require('../middleware/auth');

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.csv') ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

router.post('/owners', verifyToken, isAdmin, csvUpload.single('file'), importOwners);
router.post('/pets', verifyToken, isAdmin, csvUpload.single('file'), importPets);
router.post('/products', verifyToken, isAdmin, csvUpload.single('file'), importProducts);
router.post('/cuts', verifyToken, isAdmin, csvUpload.single('file'), importCuts);
router.post('/undo/:batchId', verifyToken, isAdmin, undoImport);
router.post('/recover/:batchId', verifyToken, isAdmin, recoverImport);
router.get('/batches', verifyToken, isAdmin, getBatches);
router.get('/audit', verifyToken, isAdmin, getAuditLogs);

module.exports = router;