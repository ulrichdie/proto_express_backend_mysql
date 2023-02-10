const AppOpeError = require("./../utils/appOpeErrors.js");

// Cast Error handler
const handleCastErrorDB = (err) => {
  const message = `paramètre invalide ${err.path} : ${err.value} 🔥`;
  return new AppOpeError(message, 400);
};

// duplicate Error handler
const handleDuplicateErrorDB = (err) => {
  // Récupérer une chaine entre quotes avec expression régulière
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Valeur en double ${value}, veuillez renseigner une autre valeur`;
  return new AppOpeError(message, 400);
};

// erreur de token invalide
const handleWrongJwtError = () => {
  const message = `Token invalide, veuillez vous connecter`;
  return new AppOpeError(message, 401);
};

// erreur de token expiré
const handleExpireJwtError = () => {
  const message = `Votre connexion a expiré, veuillez vous reconnecter`;
  return new AppOpeError(message, 401);
};

// Erreur envoyées en environnement développement
sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Erreur envoyées en environnement production
sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR : ", err);
    res.status(500).json({
      status: "error",
      message: "Quelque chose ne fonctionne pas correctement !",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    // Cas environememt de développement
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // Cas environememt de production
    const error = { ...err };
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleWrongJwtError();
    if (error.name === "TokenExpiredError") error = handleExpireJwtError();
    sendErrorProd(error, res);
  }
};
