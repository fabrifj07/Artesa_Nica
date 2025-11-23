const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor ingrese un nombre para el producto'],
      trim: true,
      maxlength: [100, 'El nombre no puede tener más de 100 caracteres'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Por favor ingrese una descripción'],
      maxlength: [2000, 'La descripción no puede tener más de 2000 caracteres'],
    },
    price: {
      type: Number,
      required: [true, 'Por favor ingrese el precio del producto'],
      min: [0, 'El precio no puede ser menor a 0'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'El descuento no puede ser menor a 0'],
      max: [100, 'El descuento no puede ser mayor a 100'],
    },
    category: {
      type: String,
      required: [true, 'Por favor seleccione una categoría'],
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
    stock: {
      type: Number,
      required: [true, 'Por favor ingrese la cantidad en inventario'],
      min: [0, 'El inventario no puede ser menor a 0'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    ratings: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      min: [1, 'La calificación debe ser al menos 1'],
      max: [5, 'La calificación no puede ser mayor a 5'],
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
      unit: {
        type: String,
        enum: ['cm', 'm', 'in', 'ft'],
        default: 'cm',
      },
      weightUnit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'g',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Crear slug del nombre del producto
ProductSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Actualizar el promedio de calificaciones al guardar
ProductSchema.pre('save', async function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const ratings = this.ratings.map((item) => item.rating);
    this.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    this.numOfReviews = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.numOfReviews = 0;
  }
  next();
});

// Crear índice para búsqueda de texto
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Método para obtener productos relacionados
ProductSchema.methods.getRelatedProducts = async function (limit = 4) {
  return await this.model('Product')
    .find({
      _id: { $ne: this._id },
      category: this.category,
      isActive: true,
    })
    .limit(limit)
    .select('name price images slug averageRating')
    .populate({
      path: 'user',
      select: 'name',
    });
};

// Middleware para eliminar imágenes asociadas al eliminar un producto
ProductSchema.pre('remove', async function (next) {
  // Aquí iría la lógica para eliminar las imágenes del almacenamiento
  console.log(`Eliminando imágenes del producto ${this._id}`);
  next();
});

// Virtual para obtener el precio con descuento
ProductSchema.virtual('discountedPrice').get(function () {
  return this.price * (1 - this.discount / 100);
});

// Virtual para revisión del usuario actual
ProductSchema.virtual('userReview', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: true,
});

module.exports = mongoose.model('Product', ProductSchema);
