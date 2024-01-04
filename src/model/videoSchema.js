const {  DataTypes } = require('sequelize') 
const database = require("../config/database.js")

const VideoModel = database.define('video', {
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
    video_path: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                args: true,
                msg: 'VideoPath is not be empty.'
            }
        },
        allowNull: false,
    },
    vtt_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
});

module.exports = VideoModel