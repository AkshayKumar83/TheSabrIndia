import express from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  addProduct,
  updateProduct,
  updateProductOnly,
  addProductVariant,
  getProductVariant,
  getProductVariantByProduct,
  listProductVariantsByProduct,
  updateProductVariant,
  updateProductVariantByProduct,
  deleteProductVariant,
  deleteProduct,
  uploadProductImages,
} from '../controllers/productController.js';
import { createImageUpload } from '../middleware/upload.js';

const router = express.Router();
const uploadProductImagesMiddleware = createImageUpload({
  folder: 'products',
  prefix: 'product',
  fieldName: 'images',
  bodyField: 'imageUrls',
  multiple: true,
  maxCount: 10,
});

router.post('/images', uploadProductImagesMiddleware, uploadProductImages);
router.post('/variants', addProductVariant);
router.get('/variants', listProductVariantsByProduct);
router.post('/:productId/variants', addProductVariant);
router.get('/variants/list', listProductVariantsByProduct);
router.get('/variants/:variantId', getProductVariant);
router.get('/:productId/variants', listProductVariantsByProduct);
router.get('/:productId/variants/:variantId', getProductVariantByProduct);
router.put('/:productId/variants/:variantId', updateProductVariantByProduct);
router.put('/variants/:variantId', updateProductVariant);
router.delete('/variants/:variantId', deleteProductVariant);
router.get('/list', listProducts);
router.get('/get/:id', getProduct);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/add', addProduct);
router.post('/', createProduct);
router.put('/update/:id', updateProductOnly);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
