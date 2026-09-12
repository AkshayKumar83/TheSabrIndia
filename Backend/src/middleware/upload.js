import multer from 'multer';
import { createImageStorage } from '../utils/imageStorage.js';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

function createImageUpload({
  folder = 'images',
  prefix = 'image',
  fieldName = 'image',
  bodyField = 'imageUrl',
  urlPrefix = '/uploads',
} = {}) {

  const upload = multer({
    storage: createImageStorage({ folder, prefix }),
    fileFilter: (req, file, callback) => {
      if (!allowedImageTypes.includes(file.mimetype)) {
        return callback(new Error('Only JPG, PNG and WEBP images are allowed'));
      }

      return callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (req.file) {
        req.body = req.body || {};
        req.body[bodyField] = `${urlPrefix}/${folder}/${req.file.filename}`;
      }

      return next();
    });
  };
}

export { createImageUpload };



//// "/uploads/categories/category-1789231606831-957205451.png"