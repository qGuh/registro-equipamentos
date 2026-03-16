const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UP_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UP_DIR),
  filename: (_, file, cb) => {
    const uniq = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // preserva a extensão
    const ext = path.extname(file.originalname || '');
    cb(null, `${uniq}${ext || ''}`);
  }
});

module.exports = multer({ storage });
module.exports.UP_DIR = UP_DIR;