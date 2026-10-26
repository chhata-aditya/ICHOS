const express = require('express');
const multer = require('multer');
const { imageToVibe, textToVibe } = require('../controllers/vibeController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
    return callback(new Error('Upload a JPG, PNG, or WEBP image.'));
  },
});

router.post('/text', textToVibe);
router.post('/image', upload.single('image'), imageToVibe);

module.exports = router;
