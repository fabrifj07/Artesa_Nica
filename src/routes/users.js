const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  deleteAccount,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  getMyStores,
  getMyOrders,
  getMyFavorites,
  addToFavorites,
  removeFromFavorites,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para el perfil del usuario autenticado
router.get('/me', getUserProfile);
router.put('/me', updateProfile);
router.delete('/me', deleteAccount);
router.put('/me/photo', uploadUserPhoto);

// Rutas para direcciones
router.put('/me/address', updateAddress);
router.delete('/me/address/:addressId', deleteAddress);
router.put('/me/address/:addressId/default', setDefaultAddress);

// Rutas para tiendas del usuario
router.get('/me/stores', authorize('seller', 'admin'), getMyStores);

// Rutas para órdenes del usuario
router.get('/me/orders', getMyOrders);

// Rutas para favoritos
router.get('/me/favorites', getMyFavorites);
router.post('/me/favorites/:productId', addToFavorites);
router.delete('/me/favorites/:productId', removeFromFavorites);

// Rutas para administradores
router.use(authorize('admin'));

router.get('/', getUsers);
router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
