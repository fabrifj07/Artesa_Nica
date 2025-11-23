const express = require('express');
const router = express.Router();
const {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getStoreStats,
  searchStores,
  getStoreOrders,
  getStoreOrderStats,
} = require('../controllers/storeController');

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Store = require('../models/Store');

// Incluir otros recursos
const productRouter = require('./products');

// Redirigir a las rutas de productos de la tienda
router.use('/:storeId/products', productRouter);

// Rutas públicas
router.get('/', advancedResults(Store, 'owner'), getStores);
router.get('/search', searchStores);
router.get('/:id', getStore);

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas para vendedores y administradores
router.post('/', authorize('user', 'admin'), createStore);

router.put('/:id', authorize('seller', 'admin'), updateStore);
router.delete('/:id', authorize('seller', 'admin'), deleteStore);

// Estadísticas de la tienda
router.get('/:id/stats', authorize('seller', 'admin'), getStoreStats);
router.get('/:storeId/orders', authorize('seller', 'admin'), getStoreOrders);
router.get(
  '/:storeId/orders/stats',
  authorize('seller', 'admin'),
  getStoreOrderStats
);

module.exports = router;
