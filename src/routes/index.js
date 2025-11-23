const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const storeRoutes = require('./stores');
const orderRoutes = require('./orders');
const cartRoutes = require('./cart');

// Middleware de autenticación
const { protect, authorize } = require('../middleware/auth');

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios
router.use('/users', protect, userRoutes);

// Rutas de productos
router.use('/products', productRoutes);

// Rutas de tiendas
router.use('/stores', storeRoutes);

// Rutas de órdenes
router.use('/orders', protect, orderRoutes);

// Rutas del carrito
router.use('/cart', protect, cartRoutes);

// Ruta de prueba
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a la API de Artesanica',
    version: '1.0.0',
    documentation: '/api-docs', // Futura documentación con Swagger
  });
});

// Ruta 404
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

module.exports = router;
