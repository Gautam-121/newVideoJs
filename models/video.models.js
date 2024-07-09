const {  DataTypes } = require('sequelize') 
const {sequelize} = require("../db/index.js")
const Feedback = require('./feedback.models.js');
const PlanRestrict = require("../models/planrestrict.model.js")

const Video = sequelize.define('Video', {
    video_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        unique: {
            args: true,
            msg: 'Video ID must be unique.'
        },
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                args: true,
                msg: 'Title must not be empty'
            }
        },
        allowNull: false,
    },
    videoFileUrl:{
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
    },
    videoData:{
        type: DataTypes.JSON,
        allowNull: false,
        validate:{
         notEmpty:{
           msg: "VideoData is Required"
         }
        }
    },
    videoSelectedFile: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    videoLength:{
        type:DataTypes.INTEGER,
        allowNull: false
    },
    isShared: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isDeleted:{
        type:DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdBy:{
        type:DataTypes.UUID,
        allowNull: false
    }
});

Video.hasMany(Feedback, { // Assuming each video can have multiple feedbacks
    foreignKey: 'videoId',
    as: "feedback"
});

Video.hasMany(PlanRestrict, { // Each video can have multiple plan restrictions
    foreignKey: 'planId',
    as: "plans"
});


module.exports = Video


