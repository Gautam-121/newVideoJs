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
    videoSelectedFile: {
        type: DataTypes.JSONB,
        allowNull: false
    }
});

module.exports = VideoModel