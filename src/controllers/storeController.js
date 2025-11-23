const Store = require('../models/Store');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');

// @desc    Obtener todas las tiendas
// @route   GET /api/v1/stores
// @access  Public
exports.getStores = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtener una sola tienda
// @route   GET /api/v1/stores/:id
// @access  Public
exports.getStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id)
    .populate({
      path: 'owner',
      select: 'name email phone',
    })
    .populate({
      path: 'products',
      select: 'name price images averageRating numOfReviews',
      match: { isActive: true },
      options: { limit: 8 },
    });

  if (!store || !store.isActive) {
    return next(
      new ErrorResponse(`No se encontró la tienda con el id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Crear una nueva tienda
// @route   POST /api/v1/stores
// @access  Private (Vendedor/Admin)
exports.createStore = asyncHandler(async (req, res, next) => {
  // Verificar si el usuario ya tiene una tienda
  const existingStore = await Store.findOne({ owner: req.user.id });
  
  if (existingStore && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`El usuario ${req.user.id} ya tiene una tienda registrada`, 400)
    );
  }

  // Agregar el propietario al cuerpo de la solicitud
  req.body.owner = req.user.id;
  
  // Si el usuario es admin, permitir especificar otro propietario
  if (req.user.role === 'admin' && req.body.userId) {
    req.body.owner = req.body.userId;
  }

  const store = await Store.create(req.body);

  // Actualizar el rol del usuario a 'seller' si no es admin
  if (req.user.role === 'user') {
    await User.findByIdAndUpdate(req.user.id, { role: 'seller' });
  }

  res.status(201).json({
    success: true,
    data: store,
  });
});

// @desc    Actualizar una tienda
// @route   PUT /api/v1/stores/:id
// @access  Private (Vendedor/Admin)
exports.updateStore = asyncHandler(async (req, res, next) => {
  let store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorResponse(`No se encontró la tienda con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño de la tienda o admin
  if (store.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para actualizar esta tienda`,
        401
      )
    );
  }

  // Si se envía logo, manejarlo
  if (req.files && req.files.logo) {
    const file = req.files.logo;

    // Verificar que el archivo sea una imagen
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Por favor suba un archivo de imagen`, 400));
    }

    // Crear nombre de archivo personalizado
    file.name = `logo_${store._id}${path.parse(file.name).ext}`;

    // Mover el archivo a la carpeta de uploads
    await file.mv(`${process.env.FILE_UPLOAD_PATH}/stores/${file.name}`);

    // Actualizar el logo
    req.body.logo = {
      public_id: `store_logo_${store._id}`,
      url: `/uploads/stores/${file.name}`,
    };
  }

  // Si se envía banner, manejarlo
  if (req.files && req.files.banner) {
    const file = req.files.banner;

    // Verificar que el archivo sea una imagen
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Por favor suba un archivo de imagen`, 400));
    }

    // Crear nombre de archivo personalizado
    file.name = `banner_${store._id}${path.parse(file.name).ext}`;

    // Mover el archivo a la carpeta de uploads
    await file.mv(`${process.env.FILE_UPLOAD_PATH}/stores/${file.name}`);

    // Actualizar el banner
    req.body.banner = {
      public_id: `store_banner_${store._id}`,
      url: `/uploads/stores/${file.name}`,
    };
  }

  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: store,
  });
});

// @desc    Eliminar una tienda
// @route   DELETE /api/v1/stores/:id
// @access  Private (Vendedor/Admin)
exports.deleteStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorResponse(`No se encontró la tienda con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño de la tienda o admin
  if (store.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para eliminar esta tienda`,
        401
      )
    );
  }

  // Eliminar imágenes del almacenamiento
  if (store.logo && store.logo.url) {
    // Aquí iría la lógica para eliminar el logo del almacenamiento
    const logoPath = path.join(__dirname, `../../public${store.logo.url}`);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }
  }

  if (store.banner && store.banner.url) {
    // Aquí iría la lógica para eliminar el banner del almacenamiento
    const bannerPath = path.join(__dirname, `../../public${store.banner.url}`);
    if (fs.existsSync(bannerPath)) {
      fs.unlinkSync(bannerPath);
    }
  }

  // Eliminar la tienda (soft delete)
  store.isActive = false;
  await store.save();

  // Si el usuario no es admin, cambiar su rol a 'user' si no tiene más tiendas activas
  if (req.user.role !== 'admin') {
    const activeStores = await Store.countDocuments({
      owner: req.user.id,
      isActive: true,
    });

    if (activeStores === 0) {
      await User.findByIdAndUpdate(req.user.id, { role: 'user' });
    }
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obtener estadísticas de la tienda
// @route   GET /api/v1/stores/:id/stats
// @access  Private (Vendedor/Admin)
exports.getStoreStats = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store || !store.isActive) {
    return next(
      new ErrorResponse(`No se encontró la tienda con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño de la tienda o admin
  if (store.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para ver las estadísticas de esta tienda`,
        401
      )
    );
  }

  // Obtener estadísticas de productos
  const productStats = await Product.aggregate([
    {
      $match: {
        store: store._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSold: { $sum: '$sold' },
        avgRating: { $avg: '$averageRating' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  // Obtener productos más vendidos
  const topProducts = await Product.find({
    store: store._id,
    isActive: true,
  })
    .sort({ sold: -1 })
    .limit(5)
    .select('name price images sold averageRating');

  // Obtener productos mejor calificados
  const topRatedProducts = await Product.find({
    store: store._id,
    isActive: true,
    averageRating: { $gte: 4 },
  })
    .sort({ averageRating: -1 })
    .limit(5)
    .select('name price images sold averageRating');

  res.status(200).json({
    success: true,
    data: {
      productStats,
      topProducts,
      topRatedProducts,
      totalProducts: await Product.countDocuments({
        store: store._id,
        isActive: true,
      }),
      totalSold: await Product.aggregate([
        {
          $match: {
            store: store._id,
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$sold' },
          },
        },
      ]).then((result) => (result[0] ? result[0].total : 0)),
      averageRating: await Product.aggregate([
        {
          $match: {
            store: store._id,
            isActive: true,
            averageRating: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$averageRating' },
          },
        },
      ]).then((result) => (result[0] ? result[0].average : 0)),
    },
  });
});

// @desc    Buscar tiendas
// @route   GET /api/v1/stores/search
// @access  Public
exports.searchStores = asyncHandler(async (req, res, next) => {
  const { q, category, sort, page = 1, limit = 10 } = req.query;
  
  // Construir objeto de consulta
  const query = { isActive: true };
  
  // Búsqueda por texto
  if (q) {
    query.$text = { $search: q };
  }
  
  // Filtrar por categoría
  if (category) {
    query.categories = category;
  }
  
  // Opciones de ordenamiento
  let sortOption = {};
  if (sort === 'name_asc') sortOption = { name: 1 };
  else if (sort === 'name_desc') sortOption = { name: -1 };
  else if (sort === 'rating') sortOption = { 'rating.average': -1 };
  else sortOption = { createdAt: -1 }; // Por defecto, ordenar por más reciente
  
  // Paginación
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = Number(page) * Number(limit);
  const total = await Store.countDocuments(query);
  
  // Ejecutar consulta
  const stores = await Store.find(query)
    .sort(sortOption)
    .limit(Number(limit))
    .skip(startIndex)
    .populate({
      path: 'owner',
      select: 'name',
    });
  
  // Resultados de paginación
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: Number(page) + 1,
      limit: Number(limit),
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: Number(page) - 1,
      limit: Number(limit),
    };
  }
  
  res.status(200).json({
    success: true,
    count: stores.length,
    pagination,
    data: stores,
  });
});
