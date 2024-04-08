const {  DataTypes } = require('sequelize') 
const {sequelize} = require("../db/index.js")
const User = require("./user.models.js");
const Feedback = require('./feedback.models.js');

const Video = sequelize.define('Video', {
    video_id: {
        type: DataTypes.STRING,
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
    }
});

Video.belongsTo(User,{
    foreignKey:"createdById",
    as: "createdByRes"
})

Video.hasMany(Feedback, { // Assuming each video can have multiple feedbacks
    foreignKey: 'videoId',
    as: "feedback"
});

module.exports = Video


