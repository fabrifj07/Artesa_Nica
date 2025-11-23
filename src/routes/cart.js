const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  applyCoupon,
} = require('../controllers/cartController');

const { protect } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener el carrito del usuario
router.get('/', getCart);

// Agregar producto al carrito
router.post('/:productId', addToCart);

// Actualizar cantidad de un producto en el carrito
router.put('/:productId', updateCartItem);

// Eliminar producto del carrito
router.delete('/:productId', removeFromCart);

// Vaciar el carrito
router.delete('/', clearCart);

// Obtener resumen del carrito (precios, envío, totales)
router.get('/summary', getCartSummary);

// Aplicar cupón de descuento
router.post('/apply-coupon', applyCoupon);

module.exports = router;
