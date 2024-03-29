const {  DataTypes } = require('sequelize') 
const {sequelize} = require("../db/index.js")
const User = require("./user.models.js")

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
    videoSelectedFile: {
        type: DataTypes.JSONB,
        allowNull: true,
    }
});

Video.belongsTo(User,{
    foreignKey:"createdById",
    as: "createdBy"
})

module.exports = Video