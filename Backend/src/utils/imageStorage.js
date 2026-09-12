import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

function createImageStorage({ folder = 'images', prefix = 'image' } = {}) {
  const uploadDirectory = path.join(process.cwd(), 'uploads', folder);
  fs.mkdirSync(uploadDirectory, { recursive: true });

  return multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      callback(null, filename);
    },
  });
}

export { createImageStorage };
