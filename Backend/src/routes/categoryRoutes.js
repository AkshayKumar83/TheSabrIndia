import express from 'express';
import {
  listCategories,
  listCategoriesByStatus,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { createImageUpload } from '../middleware/upload.js';

const router = express.Router();
const uploadCategoryImage = createImageUpload({
  folder: 'categories',
  prefix: 'category',
});

router.get('/', listCategories);
router.get('/status/:status', listCategoriesByStatus);
router.get('/:id', getCategory);
router.post('/', uploadCategoryImage, createCategory);
router.put('/:id', uploadCategoryImage, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
