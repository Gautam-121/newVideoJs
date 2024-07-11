const { sequelize } = require("../db/index.js")
const { DataTypes } = require('sequelize');
const Video = require("./video.models.js")

const PlanRestrict = sequelize.define("planRestrict" , {
     id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey: true
    },
    plans:DataTypes.JSON,
})

// Define the associations
Video.hasMany(PlanRestrict, { 
    foreignKey: 'videoId',
    as: 'plans'  // This is how you'll access PlanRestricts from a Video instance
  });
  
  PlanRestrict.belongsTo(Video, { 
    foreignKey: 'videoId',
    as: 'video'  // This is how you'll access the Video from a PlanRestrict instance
  });

module.exports = PlanRestrict


