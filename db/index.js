const {Sequelize} = require("sequelize")
require("dotenv").config()


const sequelize = new Sequelize(process.env.DATABASE_URI,{
  dialectModule: require('pg')
});

const connectDB = async () => {
  try {
    await sequelize.sync();
    console.log("Database Connected Successfully");
  } catch (err) {
    console.log("Database Error:", err);
  }
};

module.exports = {connectDB , sequelize}




