const { sequelize } = require("../db/index.js")
const { DataTypes } = require('sequelize');
const Video = require("./video.models.js")

const PlanRestrict = sequelize.define("planRestrict" , {
    plans:DataTypes.JSON,
})

PlanRestrict.belongsTo(Video, {foreignKey:"videoId" , as:"video"})

module.exports = PlanRestrict


