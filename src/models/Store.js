const mongoose = require('mongoose');
const slugify = require('slugify');

const StoreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor ingrese un nombre para la tienda'],
      trim: true,
      maxlength: [100, 'El nombre no puede tener más de 100 caracteres'],
      unique: true,
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Por favor ingrese una descripción de la tienda'],
      maxlength: [2000, 'La descripción no puede tener más de 2000 caracteres'],
    },
    logo: {
      public_id: {
        type: String,
        default: 'default_logo',
      },
      url: {
        type: String,
        default: '/img/default-store.png',
      },
    },
    banner: {
      public_id: String,
      url: String,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    contact: {
      email: {
        type: String,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Por favor ingrese un correo electrónico válido',
        ],
      },
      phone: {
        type: String,
        maxlength: [20, 'El número de teléfono no puede tener más de 20 caracteres'],
      },
      website: String,
      socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        whatsapp: String,
      },
    },
    address: {
      street: {
        type: String,
        required: [true, 'Por favor ingrese la dirección'],
      },
      city: {
        type: String,
        required: [true, 'Por favor ingrese la ciudad'],
      },
      state: {
        type: String,
        required: [true, 'Por favor ingrese el departamento'],
      },
      postalCode: String,
      country: {
        type: String,
        default: 'Nicaragua',
      },
      location: {
        // GeoJSON Point
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
          index: '2dsphere',
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
      },
    },
    businessHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    policies: {
      shipping: {
        local: { type: Boolean, default: true },
        national: { type: Boolean, default: false },
        international: { type: Boolean, default: false },
        pickup: { type: Boolean, default: true },
        returnDays: { type: Number, default: 7 },
      },
      payment: [
        {
          type: String,
          enum: ['efectivo', 'tarjeta', 'transferencia', 'paypal', 'otro'],
        },
      ],
    },
    rating: {
      average: {
        type: Number,
        min: [1, 'La calificación debe ser al menos 1'],
        max: [5, 'La calificación no puede ser mayor a 5'],
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      },
      message: String,
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    },
    categories: [
      {
        type: String,
        enum: [
          'textiles',
          'ceramica',
          'joyeria',
          'muebles',
          'decoracion',
          'accesorios',
          'otros',
        ],
      },
    ],
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Crear slug del nombre de la tienda
StoreSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Actualizar el promedio de calificaciones al guardar
StoreSchema.pre('save', async function (next) {
  // Aquí iría la lógica para calcular el promedio de calificaciones
  // basado en las reseñas de los productos de la tienda
  next();
});

// Crear índice para búsqueda de texto
StoreSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Middleware para manejar la eliminación en cascada
StoreSchema.pre('remove', async function (next) {
  console.log(`Eliminando productos de la tienda ${this._id}`);
  // Aquí iría la lógica para eliminar los productos asociados
  await this.model('Product').deleteMany({ store: this._id });
  next();
});

// Virtual para obtener los productos de la tienda
StoreSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'store',
  justOne: false,
});

// Virtual para obtener las órdenes de la tienda
StoreSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'store',
  justOne: false,
});

module.exports = mongoose.model('Store', StoreSchema);
