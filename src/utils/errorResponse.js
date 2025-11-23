class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Mantener el stack trace para depuración
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
