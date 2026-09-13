import multer from 'multer';
import { createImageStorage } from '../utils/imageStorage.js';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

function createImageUpload({
  folder = 'images',
  prefix = 'image',
  fieldName = 'image',
  bodyField = 'imageUrl',
  urlPrefix = '/uploads',
  multiple = false,
  maxCount = 10,
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
  });

  const uploadHandler = multiple ? upload.array(fieldName, maxCount) : upload.single(fieldName);

  return (req, res, next) => {
    uploadHandler(req, res, (error) => {
      console.log('Uploaded files:', error);
      if (error) {
        return res.status(400).json({ message: error.message });
      }
    console.log('Uploaded files:', req.files, req.body);
      if (req.file) {
        
        req.body = req.body || {};
        req.body[bodyField] = `${urlPrefix}/${folder}/${req.file.filename}`;
      }

      if (req.files) {
        req.body = req.body || {};
        req.body[bodyField] = req.files.map((file) => `${urlPrefix}/${folder}/${file.filename}`);
      }

      return next();
    });
  };
}

export { createImageUpload };



//// "/uploads/categories/category-1789231606831-957205451.png"