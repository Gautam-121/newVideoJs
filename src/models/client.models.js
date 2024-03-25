const {sequelize} = require("../db/index.js")
const {DataTypes} = require("sequelize")

const Client = sequelize.define("Client",{
    name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    otp:{
        type: DataTypes.INTEGER,
    }
})

module.exports = Client