const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Obtener el carrito del usuario
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  const user = await req.user.populate('cart.items.productId');
  
  const products = user.cart.items.map(item => ({
    product: item.productId,
    quantity: item.quantity
  }));

  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Agregar producto al carrito
// @route   POST /api/v1/cart/:productId
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity = 1 } = req.body;

  // Verificar que el producto existe y está activo
  const product = await Product.findOne({ _id: productId, isActive: true });
  
  if (!product) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${productId}`, 404)
    );
  }

  // Verificar que hay suficiente stock
  if (product.stock < quantity) {
    return next(
      new ErrorResponse(
        `No hay suficiente stock. Solo quedan ${product.stock} unidades disponibles`,
        400
      )
    );
  }

  // Agregar al carrito
  const user = req.user;
  await user.addToCart(product, quantity);

  res.status(200).json({
    success: true,
    message: 'Producto agregado al carrito',
    data: { product: product._id, quantity }
  });
});

// @desc    Actualizar cantidad de un producto en el carrito
// @route   PUT /api/v1/cart/:productId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(
      new ErrorResponse('La cantidad debe ser mayor a 0', 400)
    );
  }

  // Verificar que el producto existe y está activo
  const product = await Product.findOne({ _id: productId, isActive: true });
  
  if (!product) {
    return next(
      new ErrorResponse(`No se encontró el producto con el id ${productId}`, 404)
    );
  }

  // Verificar que hay suficiente stock
  if (product.stock < quantity) {
    return next(
      new ErrorResponse(
        `No hay suficiente stock. Solo quedan ${product.stock} unidades disponibles`,
        400
      )
    );
  }

  // Actualizar cantidad en el carrito
  const user = req.user;
  await user.updateCartItem(productId, quantity);

  res.status(200).json({
    success: true,
    message: 'Carrito actualizado',
    data: { product: product._id, quantity }
  });
});

// @desc    Eliminar producto del carrito
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const user = req.user;

  // Verificar si el producto está en el carrito
  const cartItem = user.cart.items.find(
    item => item.productId.toString() === productId
  );

  if (!cartItem) {
    return next(
      new ErrorResponse(
        `El producto con id ${productId} no está en el carrito`,
        404
      )
    );
  }

  // Eliminar del carrito
  await user.removeFromCart(productId);

  res.status(200).json({
    success: true,
    message: 'Producto eliminado del carrito',
    data: { productId }
  });
});

// @desc    Vaciar el carrito
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  await req.user.clearCart();
  
  res.status(200).json({
    success: true,
    message: 'Carrito vaciado correctamente',
    data: {}
  });
});

// @desc    Obtener resumen del carrito
// @route   GET /api/v1/cart/summary
// @access  Private
exports.getCartSummary = asyncHandler(async (req, res, next) => {
  const user = await req.user.populate('cart.items.productId');
  
  let total = 0;
  let items = [];
  let stores = new Map(); // Para agrupar productos por tienda

  // Calcular totales y agrupar por tienda
  for (const item of user.cart.items) {
    const product = item.productId;
    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    // Agrupar por tienda
    if (!stores.has(product.store.toString())) {
      const store = await Store.findById(product.store);
      stores.set(product.store.toString(), {
        store: {
          _id: store._id,
          name: store.name,
          logo: store.logo,
          shippingPolicy: store.policies?.shipping || {}
        },
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0
      });
    }

    const storeData = stores.get(product.store.toString());
    storeData.items.push({
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '/img/default-product.png',
        slug: product.slug
      },
      quantity: item.quantity,
      total: itemTotal
    });
    storeData.subtotal += itemTotal;
  }

  // Calcular envío y total por tienda
  for (const [storeId, storeData] of stores.entries()) {
    // Aquí iría la lógica para calcular el envío
    // Por ahora, un envío fijo de $5 por tienda
    storeData.shipping = 5;
    storeData.total = storeData.subtotal + storeData.shipping;
    
    // Convertir a objeto para la respuesta
    stores.set(storeId, storeData);
  }

  // Convertir el mapa a un array de objetos
  const storeArray = Array.from(stores.values());

  // Calcular total general
  const shippingTotal = storeArray.reduce((sum, store) => sum + store.shipping, 0);
  const grandTotal = total + shippingTotal;

  res.status(200).json({
    success: true,
    data: {
      stores: storeArray,
      summary: {
        subtotal: total,
        shipping: shippingTotal,
        tax: 0, // Se podría agregar lógica de impuestos
        total: grandTotal
      },
      itemCount: user.cart.items.reduce((sum, item) => sum + item.quantity, 0),
      storeCount: storeArray.length
    }
  });
});

// @desc    Aplicar código de descuento
// @route   POST /api/v1/cart/apply-coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponCode } = req.body;
  
  // Aquí iría la lógica para validar el cupón
  // Por ahora, simulamos un cupón del 10%
  const validCoupons = {
    'ARTESANICA10': 10,
    'BIENVENIDO15': 15
  };

  const discount = validCoupons[couponCode] || 0;

  if (discount === 0) {
    return next(
      new ErrorResponse('Cupón no válido o expirado', 400)
    );
  }

  // Obtener resumen del carrito
  const cartSummary = await this.getCartSummary(req, res, next);
  
  // Aplicar descuento
  const discountAmount = (cartSummary.data.summary.subtotal * discount) / 100;
  const newTotal = cartSummary.data.summary.total - discountAmount;

  // Aquí podrías guardar el cupón aplicado en la sesión o en la base de datos
  // req.session.coupon = { code: couponCode, discount, discountAmount };

  res.status(200).json({
    success: true,
    message: `Cupón aplicado: ${discount}% de descuento`,
    data: {
      coupon: {
        code: couponCode,
        discount,
        discountAmount
      },
      newTotal
    }
  });
});
