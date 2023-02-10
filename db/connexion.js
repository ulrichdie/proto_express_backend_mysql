const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const connection = mysql.createConnection({
  host: process.env.SERVER_BDD,
  user: process.env.USER_BDD,
  password: process.env.PWD_BDD,
  database: process.env.BDD,
});

module.exports = connection;
