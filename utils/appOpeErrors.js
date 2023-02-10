class AppOpeError extends Error {
  constructor(message, statusCode) {
    // Récupérer le message de la classe erreur avec super
    super(message);
    this.statusCode = statusCode;
    this.status = "error";
    this.isOperational = "true";

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppOpeError;
