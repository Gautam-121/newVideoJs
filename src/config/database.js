// config/database.js
const  {Sequelize} =  require("sequelize") 
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize({
  dialect: process.env.Dialect,
  host: process.env.Host,
  username: process.env.User,
  password:  process.env.Password,
  database: process.env.Database
});

module.exports = sequelize




