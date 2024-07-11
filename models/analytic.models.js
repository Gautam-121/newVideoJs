const { sequelize } = require("../db/index")
const { DataTypes } = require("sequelize")
const Video = require("./video.models.js")

const Analytic = sequelize.define("Analytic", {
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey: true
    },
    totalResponse:{
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    analyticData :{
        type: DataTypes.JSON,
        allowNull: false
    }
})


Analytic.belongsTo(Video , {
    foreignKey:"videoId",
    as: "videoRes"
})

module.exports = Analytic