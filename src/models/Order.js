const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Por favor ingrese su nombre completo'],
  },
  address: {
    type: String,
    required: [true, 'Por favor ingrese su dirección'],
  },
  city: {
    type: String,
    required: [true, 'Por favor ingrese su ciudad'],
  },
  state: {
    type: String,
    required: [true, 'Por favor ingrese su departamento/estado'],
  },
  postalCode: {
    type: String,
    required: [true, 'Por favor ingrese su código postal'],
  },
  country: {
    type: String,
    required: [true, 'Por favor ingrese su país'],
    default: 'Nicaragua',
  },
  phone: {
    type: String,
    required: [true, 'Por favor ingrese su número de teléfono'],
  },
  email: {
    type: String,
    required: [true, 'Por favor ingrese su correo electrónico'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un correo electrónico válido',
    ],
  },
  notes: {
    type: String,
  },
});

const paymentResultSchema = new mongoose.Schema({
  id: { type: String },
  status: { type: String },
  update_time: { type: String },
  email_address: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      required: true,
      enum: ['paypal', 'stripe', 'contraentrega', 'transferencia'],
    },
    paymentResult: paymentResultSchema,
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    trackingNumber: {
      type: String,
    },
    carrier: {
      type: String,
    },
    shippingMethod: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'delivery',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Método para calcular el total de la orden
orderSchema.methods.calculateTotals = async function () {
  // Calcular subtotal
  const subtotal = this.orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calcular impuestos (15% en Nicaragua)
  const taxRate = 0.15;
  const taxPrice = subtotal * taxRate;

  // Calcular total
  const total = subtotal + taxPrice + this.shippingPrice;

  // Actualizar campos
  this.taxPrice = taxPrice;
  this.totalPrice = total;

  return this.save();
};

// Middleware para actualizar el stock cuando se cancela una orden
orderSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === 'cancelled' && this.isActive) {
    // Actualizar stock de productos
    for (const item of this.orderItems) {
      await this.model('Product').updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity, sold: -item.quantity } }
      );
    }
    this.isActive = false;
  }
  next();
});

// Índices para búsquedas frecuentes
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'orderItems.store': 1 });

// Método para obtener el estado de la orden en texto
orderSchema.virtual('statusText').get(function () {
  if (this.status === 'pending') return 'Pendiente';
  if (this.status === 'processing') return 'En proceso';
  if (this.status === 'shipped') return 'Enviada';
  if (this.status === 'delivered') return 'Entregada';
  if (this.status === 'cancelled') return 'Cancelada';
  return this.status;
});

// Método para obtener el método de pago en texto
orderSchema.virtual('paymentMethodText').get(function () {
  const methods = {
    paypal: 'PayPal',
    stripe: 'Tarjeta de crédito/débito',
    contraentrega: 'Contra entrega',
    transferencia: 'Transferencia bancaria',
  };
  return methods[this.paymentMethod] || this.paymentMethod;
});

// Método para obtener el método de envío en texto
orderSchema.virtual('shippingMethodText').get(function () {
  return this.shippingMethod === 'pickup' ? 'Recoger en tienda' : 'Envío a domicilio';
});

// Método para verificar si la orden puede ser cancelada
orderSchema.methods.canBeCancelled = function () {
  return this.status === 'pending' || this.status === 'processing';
};

// Método para cancelar la orden
orderSchema.methods.cancel = async function (reason) {
  if (!this.canBeCancelled()) {
    throw new Error('Esta orden no puede ser cancelada');
  }

  this.status = 'cancelled';
  this.notes = this.notes
    ? `${this.notes}\nOrden cancelada: ${reason}`
    : `Orden cancelada: ${reason}`;

  return this.save();
};

// Método para marcar como enviada
orderSchema.methods.markAsShipped = async function (trackingInfo = {}) {
  if (this.status !== 'processing') {
    throw new Error('Solo las órdenes en proceso pueden ser marcadas como enviadas');
  }

  this.status = 'shipped';
  this.trackingNumber = trackingInfo.trackingNumber || this.trackingNumber;
  this.carrier = trackingInfo.carrier || this.carrier;

  return this.save();
};

// Método para marcar como entregada
orderSchema.methods.markAsDelivered = async function () {
  if (this.status !== 'shipped') {
    throw new Error('Solo las órdenes enviadas pueden ser marcadas como entregadas');
  }

  this.status = 'delivered';
  this.isDelivered = true;
  this.deliveredAt = Date.now();

  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
