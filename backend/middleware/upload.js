/**
 * Upload middleware using multer
 * - Stores file in memory (no disk writes)
 * - Validates file type (JPEG / PNG only)
 * - Limits file size to 10MB
 */
const multer = require('multer');

// Use memory storage so we can pipe the buffer directly to APIs
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

module.exports = upload;
