const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs');

// @desc    Obtener todos los productos
// @route   GET /api/v1/products
// @route   GET /api/v1/stores/:storeId/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  if (req.params.storeId) {
    const products = await Product.find({ store: req.params.storeId, isActive: true })
      .populate({
        path: 'user',
        select: 'name',
      })
      .populate({
        path: 'store',
        select: 'name logo',
      });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Obtener un solo producto
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'user',
      select: 'name',
    })
    .populate({
      path: 'store',
      select: 'name logo rating',
    })
    .populate({
      path: 'ratings.user',
      select: 'name avatar',
    });

  if (!product || !product.isActive) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${req.params.id}`, 404)
    );
  }

  // Obtener productos relacionados
  const relatedProducts = await product.getRelatedProducts();

  res.status(200).json({
    success: true,
    data: {
      ...product.toObject(),
      relatedProducts,
    },
  });
});

// @desc    Crear un nuevo producto
// @route   POST /api/v1/stores/:storeId/products
// @access  Private (Vendedor/Admin)
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Agregar usuario al cuerpo de la solicitud
  req.body.user = req.user.id;
  req.body.store = req.params.storeId;

  // Verificar que el usuario sea el dueño de la tienda o admin
  const store = await Store.findById(req.params.storeId);
  
  if (!store) {
    return next(
      new ErrorResponse(`No se encontró la tienda con el id ${req.params.storeId}`, 404)
    );
  }

  if (store.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para agregar productos a esta tienda`,
        401
      )
    );
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product,
  });
});

// @desc    Actualizar un producto
// @route   PUT /api/v1/products/:id
// @access  Private (Vendedor/Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño del producto o admin
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para actualizar este producto`,
        401
      )
    );
  }

  // Si se envía imágenes, manejarlas
  if (req.files && req.files.images) {
    // Eliminar imágenes antiguas si existen
    if (product.images && product.images.length > 0) {
      // Aquí iría la lógica para eliminar las imágenes del almacenamiento
    }

    // Procesar y guardar las nuevas imágenes
    const images = [];
    
    // Si es un solo archivo, convertirlo en un array
    const files = Array.isArray(req.files.images) 
      ? req.files.images 
      : [req.files.images];
    
    for (const file of files) {
      // Aquí iría la lógica para subir la imagen al almacenamiento
      // Por ahora, solo guardamos la información básica
      images.push({
        public_id: `product_${Date.now()}_${file.name}`,
        url: `/uploads/products/${file.name}`
      });
      
      // Mover el archivo a la carpeta de uploads
      const uploadPath = path.join(__dirname, '../../public/uploads/products', file.name);
      await file.mv(uploadPath);
    }
    
    req.body.images = images;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Eliminar un producto
// @route   DELETE /api/v1/products/:id
// @access  Private (Vendedor/Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño del producto o admin
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para eliminar este producto`,
        401
      )
    );
  }

  // Eliminar imágenes del almacenamiento
  if (product.images && product.images.length > 0) {
    // Aquí iría la lógica para eliminar las imágenes del almacenamiento
  }

  // Eliminar el producto (soft delete)
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Subir imagen para un producto
// @route   PUT /api/v1/products/:id/image
// @access  Private (Vendedor/Admin)
exports.uploadProductImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño del producto o admin
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `El usuario ${req.user.id} no está autorizado para actualizar este producto`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Por favor suba un archivo`, 400));
  }

  const file = req.files.file;

  // Verificar que el archivo sea una imagen
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Por favor suba un archivo de imagen`, 400));
  }

  // Verificar el tamaño del archivo
  const maxSize = process.env.MAX_FILE_UPLOAD || 1000000;
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Por favor suba una imagen de menos de ${maxSize / 1000}KB`,
        400
      )
    );
  }

  // Crear nombre de archivo personalizado
  file.name = `photo_${product._id}${path.parse(file.name).ext}`;

  // Mover el archivo a la carpeta de uploads
  file.mv(
    `${process.env.FILE_UPLOAD_PATH}/products/${file.name}`,
    async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse(`Problema al subir el archivo`, 500));
      }

      // Actualizar la imagen del producto
      await Product.findByIdAndUpdate(req.params.id, {
        image: file.name,
      });

      res.status(200).json({
        success: true,
        data: file.name,
      });
    }
  );
});

// @desc    Calificar un producto
// @route   PUT /api/v1/products/:id/rating
// @access  Private
exports.createProductReview = asyncHandler(async (req, res, next) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${req.params.id}`, 404)
    );
  }

  // Verificar si el usuario ya calificó el producto
  const alreadyReviewed = product.ratings.find(
    (r) => r.user.toString() === req.user.id
  );

  if (alreadyReviewed) {
    // Actualizar calificación existente
    product.ratings.forEach((ratingItem) => {
      if (ratingItem.user.toString() === req.user.id) {
        ratingItem.rating = Number(rating);
        ratingItem.comment = comment;
      }
    });
  } else {
    // Agregar nueva calificación
    product.ratings.push({
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });
    product.numOfReviews = product.ratings.length;
  }

  // Calcular calificación promedio
  product.ratingsAverage =
    product.ratings.reduce((acc, item) => item.rating + acc, 0) /
    product.ratings.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Buscar productos
// @route   GET /api/v1/products/search
// @access  Public
exports.searchProducts = asyncHandler(async (req, res, next) => {
  const { q, category, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
  
  // Construir objeto de consulta
  const query = { isActive: true };
  
  // Búsqueda por texto
  if (q) {
    query.$text = { $search: q };
  }
  
  // Filtrar por categoría
  if (category) {
    query.category = category;
  }
  
  // Filtrar por rango de precios
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  
  // Opciones de ordenamiento
  let sortOption = {};
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating') sortOption = { averageRating: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };
  
  // Paginación
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = Number(page) * Number(limit);
  const total = await Product.countDocuments(query);
  
  // Ejecutar consulta
  const products = await Product.find(query)
    .sort(sortOption)
    .limit(Number(limit))
    .skip(startIndex)
    .populate({
      path: 'user',
      select: 'name',
    })
    .populate({
      path: 'store',
      select: 'name logo',
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
    count: products.length,
    pagination,
    data: products,
  });
});
