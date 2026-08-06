const multer = require('multer');

// Use memory storage instead of disk - works on Render/cloud where disk may be ephemeral
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

module.exports = upload;
