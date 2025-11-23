const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  rateProduct,
  searchProducts,
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Product = require('../models/Product');

// Incluir otros recursos
const reviewRouter = require('./reviews');

// Redirigir a las rutas de reseñas
router.use('/:productId/reviews', reviewRouter);

// Rutas públicas
router.get('/', advancedResults(Product, 'store'), getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas para vendedores y administradores
router.post(
  '/',
  authorize('seller', 'admin'),
  uploadProductImages,
  createProduct
);

router.put(
  '/:id',
  authorize('seller', 'admin'),
  uploadProductImages,
  updateProduct
);

router.delete('/:id', authorize('seller', 'admin'), deleteProduct);
router.delete('/:id/images/:imageId', authorize('seller', 'admin'), deleteProductImage);

// Ruta para calificar un producto
router.post('/:id/rate', authorize('user'), rateProduct);

module.exports = router;
