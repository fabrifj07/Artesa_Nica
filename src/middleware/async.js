// Envuelve las funciones de controlador asíncronas para manejar errores de manera más limpia
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
