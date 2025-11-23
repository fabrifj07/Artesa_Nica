const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log para desarrollo
  console.error(err.stack.red);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Error de duplicados (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `El campo ${field} ya existe con el valor: ${err.keyValue[field]}`;
    error = new ErrorResponse(message, 400);
  }

  // Error de Cast (ID de MongoDB no válido)
  if (err.name === 'CastError') {
    const message = `Recurso no encontrado con el ID ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token no válido';
    error = new ErrorResponse(message, 401);
  }

  // Error de expiración del token JWT
  if (err.name === 'TokenExpiredError') {
    const message = 'El token ha expirado';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
  });
};

module.exports = errorHandler;
