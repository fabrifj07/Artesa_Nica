const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  getOrderStats,
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas para usuarios autenticados
router.post('/', createOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/pay', updateOrderToPaid);

// Rutas para administradores y vendedores
router.use(authorize('admin', 'seller'));

router.put('/:id/deliver', updateOrderToDelivered);
router.get('/', getOrders);
router.get('/stats', authorize('admin'), getOrderStats);

module.exports = router;
