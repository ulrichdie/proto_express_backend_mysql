const express = require("express");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");

const profilRouter = require("./routes/profilRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const AppOpeError = require("./utils/appOpeErrors.js");
const globalErrorsHandler = require("./Controllers/errorController.js");

const app = express();

// MIDDLEWARE GLOBAUX

// paramétrer la sécurité des entêtes HTTP
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limiter le nombre de requetes envoyé par le client pour la sécurité
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    "Trop de requêtes envoyées de cette adresse IP, veuillez reéssayer dans 1h",
});
app.use("/api", limiter);

// Data sanitation against XSS
app.use(xss());

// prevent HTTP parameters polution
app.use(hpp());

// Body parser, transforme les données du body en req.body
app.use(
  express.json({
    // Body inférieur à 10kb autorisé
    limit: "10kb",
  })
);

// Accéder aux fichiers static d'un dossier
app.use(express.static(path.join(__dirname, "public")));

// Paramétrer les entêtes
// app.all("*", (req, res, next) => {
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With,content-type,Authorization ,Accept"
//   );
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   res.setHeader("Access-Control-Expose-Headers", "Authorization");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, OPTIONS, PUT, PATCH, DELETE"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "X-Requested-With,content-type, Authorization"
//   );
//   next();
// });

// Routers
app.use("/api/v1/profils", profilRouter);
app.use("/api/v1/users", userRouter);

// Middleware de gestion des erreurs

// Redirection pour les URL incorrects
app.all("*", (req, res, next) => {
  next(new AppOpeError(`${req.originalUrl} introuvable`, 404));
});

// ERROR MIDDLEWARE pour la gestion globale des erreurs
app.use(globalErrorsHandler);

module.exports = app;
