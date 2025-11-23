const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');

// @desc    Obtener perfil del usuario actual
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate({
      path: 'stores',
      select: 'name logo isVerified',
      match: { isActive: true },
    });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Actualizar perfil del usuario
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    bio: req.body.bio,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Subir foto de perfil
// @route   PUT /api/users/me/photo
// @access  Private
exports.uploadUserPhoto = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse('Por favor suba un archivo', 400));
  }

  const file = req.files.photo;

  // Verificar que el archivo sea una imagen
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Por favor suba un archivo de imagen', 400));
  }

  // Verificar el tamaño del archivo
  const maxSize = process.env.MAX_FILE_UPLOAD || 1000000; // 1MB por defecto
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Por favor suba una imagen de menos de ${maxSize / 1000}KB`,
        400
      )
    );
  }

  // Crear nombre de archivo personalizado
  file.name = `photo_${req.user._id}${path.parse(file.name).ext}`;

  // Mover el archivo a la carpeta de uploads
  file.mv(
    `${process.env.FILE_UPLOAD_PATH}/users/${file.name}`,
    async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Error al subir el archivo', 500));
      }

      // Actualizar la foto de perfil del usuario
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          photo: {
            public_id: `user_photo_${req.user._id}`,
            url: `/uploads/users/${file.name}`,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        success: true,
        data: user.photo,
      });
    }
  );
});

// @desc    Eliminar cuenta de usuario
// @route   DELETE /api/users/me
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  // Verificar que el usuario no tenga tiendas activas
  const stores = await Store.find({ owner: req.user.id, isActive: true });
  
  if (stores.length > 0) {
    return next(
      new ErrorResponse(
        'No puede eliminar su cuenta porque tiene tiendas activas. Por favor elimine o transfiera sus tiendas primero.',
        400
      )
    );
  }

  // Eliminar usuario (soft delete)
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  // Cerrar la sesión
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10 segundos
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obtener todas las tiendas del usuario
// @route   GET /api/users/me/stores
// @access  Private/Seller
exports.getMyStores = asyncHandler(async (req, res, next) => {
  const stores = await Store.find({ owner: req.user.id, isActive: true });

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores,
  });
});

// @desc    Obtener todas las órdenes del usuario
// @route   GET /api/users/me/orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .sort('-createdAt')
    .populate({
      path: 'orderItems.product',
      select: 'name images',
    })
    .populate({
      path: 'orderItems.store',
      select: 'name',
    });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Obtener productos favoritos del usuario
// @route   GET /api/users/me/favorites
// @access  Private
exports.getMyFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'favorites',
    select: 'name price images store',
    populate: {
      path: 'store',
      select: 'name logo',
    },
  });

  res.status(200).json({
    success: true,
    count: user.favorites.length,
    data: user.favorites,
  });
});

// @desc    Agregar producto a favoritos
// @route   POST /api/users/me/favorites/:productId
// @access  Private
exports.addToFavorites = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { productId } = req.params;

  // Verificar que el producto existe
  const product = await Product.findById(productId);
  if (!product) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${productId}`, 404)
    );
  }

  // Verificar si ya está en favoritos
  if (user.favorites.includes(productId)) {
    return next(
      new ErrorResponse('Este producto ya está en tus favoritos', 400)
    );
  }

  // Agregar a favoritos
  user.favorites.push(productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Producto agregado a favoritos',
    data: user.favorites,
  });
});

// @desc    Eliminar producto de favoritos
// @route   DELETE /api/users/me/favorites/:productId
// @access  Private
exports.removeFromFavorites = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { productId } = req.params;

  // Verificar que el producto está en favoritos
  if (!user.favorites.includes(productId)) {
    return next(
      new ErrorResponse('Este producto no está en tus favoritos', 400)
    );
  }

  // Eliminar de favoritos
  user.favorites = user.favorites.filter(
    (fav) => fav.toString() !== productId
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Producto eliminado de favoritos',
    data: user.favorites,
  });
});

// @desc    Actualizar dirección del usuario
// @route   PUT /api/users/me/address
// @access  Private
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const {
    alias,
    fullName,
    address,
    city,
    state,
    postalCode,
    country,
    phone,
    isDefault,
  } = req.body;

  const newAddress = {
    _id: req.body._id || new mongoose.Types.ObjectId(), // Para actualizar o crear
    alias,
    fullName,
    address,
    city,
    state,
    postalCode,
    country: country || 'Nicaragua',
    phone,
    isDefault: isDefault || false,
  };

  const user = await User.findById(req.user.id);

  // Si es la primera dirección, hacerla por defecto
  if (user.addresses.length === 0) {
    newAddress.isDefault = true;
  }

  // Si se está marcando como predeterminada, quitar el flag de las demás
  if (newAddress.isDefault) {
    user.addresses = user.addresses.map((addr) => ({
      ...addr._doc,
      isDefault: false,
    }));
  }

  // Actualizar dirección existente o agregar nueva
  const addressIndex = user.addresses.findIndex(
    (addr) => addr._id.toString() === newAddress._id.toString()
  );

  if (addressIndex >= 0) {
    user.addresses[addressIndex] = newAddress;
  } else {
    user.addresses.push(newAddress);
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses,
  });
});

// @desc    Eliminar dirección del usuario
// @route   DELETE /api/users/me/address/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user.id);

  // Verificar que la dirección existe
  const addressIndex = user.addresses.findIndex(
    (addr) => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(
      new ErrorResponse(
        `No se encontró la dirección con el id ${addressId}`,
        404
      )
    );
  }

  // Verificar que no sea la única dirección
  if (user.addresses.length === 1) {
    return next(
      new ErrorResponse('No puede eliminar su única dirección', 400)
    );
  }

  // Si es la dirección predeterminada, marcar otra como predeterminada
  const isDefault = user.addresses[addressIndex].isDefault;
  user.addresses.splice(addressIndex, 1);

  if (isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses,
  });
});

// @desc    Establecer dirección predeterminada
// @route   PUT /api/users/me/address/:addressId/default
// @access  Private
exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user.id);

  // Verificar que la dirección existe
  const addressIndex = user.addresses.findIndex(
    (addr) => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(
      new ErrorResponse(
        `No se encontró la dirección con el id ${addressId}`,
        404
      )
    );
  }

  // Quitar el flag de predeterminado de todas las direcciones
  user.addresses = user.addresses.map((addr) => ({
    ...addr._doc,
    isDefault: false,
  }));

  // Establecer la dirección como predeterminada
  user.addresses[addressIndex].isDefault = true;
  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses,
  });
});

// ================== ADMIN ROUTES ================== //

// @desc    Obtener todos los usuarios (admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtener un solo usuario (admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(
      new ErrorResponse(`Usuario no encontrado con el id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Actualizar usuario (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Eliminar usuario (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Verificar si el usuario tiene tiendas activas
  const stores = await Store.find({ owner: req.params.id, isActive: true });
  
  if (stores.length > 0) {
    return next(
      new ErrorResponse(
        'No se puede eliminar el usuario porque tiene tiendas activas',
        400
      )
    );
  }

  // Eliminar usuario (soft delete)
  await User.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(200).json({
    success: true,
    data: {},
  });
});
