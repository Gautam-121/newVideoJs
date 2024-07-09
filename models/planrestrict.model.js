const { sequelize } = require("../db/index.js")
const { DataTypes } = require('sequelize');
const Video = require("./video.models.js")

const PlanRestrict = sequelize.define("planRestrict" , {
    id:{
        type:DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        primaryKey:true
    },
    plans:DataTypes.JSON,
})

// Make sure Video is defined before creating the association
// PlanRestrict.belongsTo(Video, { foreignKey: "videoId", as: "video" });
// Video.hasMany(PlanRestrict, { as: 'plans' });

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


