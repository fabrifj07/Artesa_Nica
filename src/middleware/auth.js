const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const asyncHandler = require('./async');

// Proteger rutas
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Verificar el token en los headers o en las cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obtener el token del header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Obtener el token de las cookies
    token = req.cookies.token;
  }

  // Verificar que el token exista
  if (!token) {
    return next(
      new ErrorResponse('No está autorizado para acceder a esta ruta', 401)
    );
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener el usuario del token
    req.user = await User.findById(decoded.id).select('-password');

    // Verificar si el usuario existe y está activo
    if (!req.user || !req.user.isActive) {
      return next(new ErrorResponse('Usuario no autorizado', 401));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('No está autorizado para acceder a esta ruta', 401));
  }
});

// Autorizar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `El usuario con rol ${req.user.role} no está autorizado para acceder a esta ruta`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};

// Este middleware se encarga de verificar la autenticación y autorización de los usuarios.
// - `protect`: Verifica si el usuario está autenticado y agrega el usuario al objeto `req`.
// - `authorize`: Verifica si el usuario tiene el rol necesario para acceder a una ruta específica.
