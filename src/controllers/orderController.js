const Order = require('../models/Order');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Store = require('../models/Store');

// @desc    Crear una nueva orden
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    shippingAddress,
    paymentMethod,
    shippingMethod,
    items,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentResult,
  } = req.body;

  // Verificar que hay productos en el carrito
  if (!items || items.length === 0) {
    return next(new ErrorResponse('No hay productos en el carrito', 400));
  }

  // Verificar el stock de cada producto
  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product || !product.isActive) {
      return next(
        new ErrorResponse(
          `El producto ${item.name} no está disponible actualmente`,
          400
        )
      );
    }

    if (product.stock < item.quantity) {
      return next(
        new ErrorResponse(
          `No hay suficiente stock para el producto ${product.name}. Solo quedan ${product.stock} unidades`,
          400
        )
      );
    }
  }

  // Crear la orden
  const order = new Order({
    user: req.user._id,
    orderItems: items.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      store: item.store,
    })),
    shippingAddress,
    paymentMethod,
    shippingMethod,
    taxPrice: taxPrice || 0,
    shippingPrice: shippingPrice || 0,
    totalPrice,
    paymentResult: paymentResult || {},
  });

  // Guardar la orden
  const createdOrder = await order.save();

  // Actualizar el stock de los productos
  for (const item of items) {
    const product = await Product.findById(item.product);
    product.stock -= item.quantity;
    product.sold += item.quantity;
    await product.save();
  }

  // Limpiar el carrito del usuario
  req.user.cart = { items: [] };
  await req.user.save();

  // Enviar correo de confirmación (implementar después)
  // await sendOrderConfirmationEmail(req.user.email, createdOrder);

  res.status(201).json({
    success: true,
    data: createdOrder,
  });
});

// @desc    Obtener orden por ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate({
      path: 'orderItems.product',
      select: 'name price images',
    })
    .populate({
      path: 'orderItems.store',
      select: 'name logo',
    });

  if (!order) {
    return next(
      new ErrorResponse(`No se encontró la orden con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño de la orden o admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        'No estás autorizado para ver esta orden',
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Actualizar orden a pagada
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
// @desc    Actualizar orden a pagada
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`No se encontró la orden con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea el dueño de la orden o admin
  if (
    order.user.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        'No estás autorizado para actualizar esta orden',
        401
      )
    );
  }

  // Verificar que la orden no esté ya pagada
  if (order.isPaid) {
    return next(new ErrorResponse('La orden ya ha sido pagada', 400));
  }

  // Actualizar orden
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer?.email_address || req.user.email,
  };

  // Si es pago contra entrega, marcar como completada también
  if (order.paymentMethod.toLowerCase() === 'contraentrega') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();

  // Enviar correo de confirmación de pago (implementar después)
  // if (updatedOrder.isPaid) {
  //   const user = await User.findById(updatedOrder.user);
  //   await sendPaymentConfirmationEmail(user.email, updatedOrder);
  // }

  res.status(200).json({
    success: true,
    data: updatedOrder,
  });
});

// @desc    Actualizar orden a enviada
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ErrorResponse(`No se encontró la orden con el id ${req.params.id}`, 404)
    );
  }

  // Verificar que el usuario sea admin o el dueño de la tienda
  if (req.user.role !== 'admin') {
    // Verificar si el usuario es dueño de alguna tienda de la orden
    const storeIds = [...new Set(order.orderItems.map(item => item.store.toString()))];
    const stores = await Store.find({ _id: { $in: storeIds }, owner: req.user._id });
    
    if (stores.length === 0) {
      return next(
        new ErrorResponse(
          'No estás autorizado para actualizar esta orden',
          401
        )
      );
    }
  }

  // Verificar que la orden esté pagada
  if (!order.isPaid) {
    return next(new ErrorResponse('La orden no ha sido pagada', 400));
  }

  // Verificar que la orden no esté ya enviada
  if (order.isDelivered) {
    return next(new ErrorResponse('La orden ya ha sido enviada', 400));
  }

  // Actualizar orden
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  
  // Si hay información de seguimiento, actualizarla
  if (req.body.trackingNumber) {
    order.trackingNumber = req.body.trackingNumber;
  }
  
  if (req.body.carrier) {
    order.carrier = req.body.carrier;
  }

  const updatedOrder = await order.save();

  // Enviar correo de envío (implementar después)
  // if (updatedOrder.isDelivered) {
  //   const user = await User.findById(updatedOrder.user);
  //   await sendOrderShippedEmail(user.email, updatedOrder);
  // }

  res.status(200).json({
    success: true,
    data: updatedOrder,
  });
});

// @desc    Obtener órdenes del usuario
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
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

// @desc    Obtener todas las órdenes (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res, next) => {
  let query;
  
  // Si es vendedor, solo mostrar órdenes de sus productos
  if (req.user.role === 'seller') {
    // Obtener IDs de las tiendas del vendedor
    const stores = await Store.find({ owner: req.user._id });
    const storeIds = stores.map(store => store._id);
    
    // Filtrar órdenes que contengan productos de las tiendas del vendedor
    query = Order.find({
      'orderItems.store': { $in: storeIds }
    });
  } else {
    // Admin puede ver todas las órdenes
    query = Order.find({});
  }

  // Ejecutar consulta con paginación
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Order.countDocuments(query);

  const orders = await query
    .populate('user', 'id name')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Resultados de paginación
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: orders.length,
    pagination,
    data: orders,
  });
});

// @desc    Obtener órdenes por tienda
// @route   GET /api/orders/store/:storeId
// @access  Private/Seller
exports.getStoreOrders = asyncHandler(async (req, res, next) => {
  // Verificar que la tienda pertenezca al vendedor
  const store = await Store.findOne({
    _id: req.params.storeId,
    owner: req.user._id,
  });

  if (!store) {
    return next(
      new ErrorResponse(
        `No se encontró la tienda con el id ${req.params.storeId}`,
        404
      )
    );
  }

  // Buscar órdenes que contengan productos de esta tienda
  const orders = await Order.find({
    'orderItems.store': req.params.storeId,
  })
    .populate('user', 'name email')
    .populate({
      path: 'orderItems.product',
      select: 'name price',
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// @desc    Obtener estadísticas de ventas
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getOrderStats = asyncHandler(async (req, res, next) => {
  // Verificar que el usuario sea admin
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse('No estás autorizado para ver estas estadísticas', 401)
    );
  }

  // Estadísticas generales
  const stats = await Order.aggregate([
    {
      $match: { isPaid: true },
    },
    {
      $group: {
        _id: null,
        numOrders: { $sum: 1 },
        totalSales: { $sum: '$totalPrice' },
        avgOrderValue: { $avg: '$totalPrice' },
        minOrder: { $min: '$totalPrice' },
        maxOrder: { $max: '$totalPrice' },
      },
    },
  ]);

  // Ventas por mes
  const monthlyStats = await Order.aggregate([
    {
      $match: { isPaid: true },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        numOrders: { $sum: 1 },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
    {
      $limit: 6,
    },
  ]);

  // Productos más vendidos
  const topProducts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        count: { $sum: '$orderItems.quantity' },
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: stats[0] || {},
      monthlyStats,
      topProducts,
    },
  });
});

// @desc    Obtener estadísticas de ventas de la tienda
// @route   GET /api/orders/stats/store/:storeId
// @access  Private/Seller
exports.getStoreOrderStats = asyncHandler(async (req, res, next) => {
  // Verificar que la tienda pertenezca al vendedor
  const store = await Store.findOne({
    _id: req.params.storeId,
    owner: req.user._id,
  });

  if (!store) {
    return next(
      new ErrorResponse(
        `No se encontró la tienda con el id ${req.params.storeId}`,
        404
      )
    );
  }

  // Estadísticas generales
  const stats = await Order.aggregate([
    {
      $match: {
        'orderItems.store': store._id,
        isPaid: true,
      },
    },
    { $unwind: '$orderItems' },
    {
      $match: {
        'orderItems.store': store._id,
      },
    },
    {
      $group: {
        _id: null,
        numOrders: { $sum: 1 },
        totalItemsSold: { $sum: '$orderItems.quantity' },
        totalRevenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
        avgOrderValue: {
          $avg: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
      },
    },
  ]);

  // Ventas por mes
  const monthlyStats = await Order.aggregate([
    {
      $match: {
        'orderItems.store': store._id,
        isPaid: true,
      },
    },
    { $unwind: '$orderItems' },
    {
      $match: {
        'orderItems.store': store._id,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        numOrders: { $sum: 1 },
        totalSales: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
    {
      $limit: 6,
    },
  ]);

  // Productos más vendidos de la tienda
  const topProducts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $match: {
        'orderItems.store': store._id,
      },
    },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        count: { $sum: '$orderItems.quantity' },
        revenue: {
          $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
        },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  res.status(200).json({
    success: true,
    data: {
      store: {
        _id: store._id,
        name: store.name,
        logo: store.logo,
      },
      stats: stats[0] || {},
      monthlyStats,
      topProducts,
    },
  });
});
