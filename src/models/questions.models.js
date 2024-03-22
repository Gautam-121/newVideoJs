const { DataTypes } = require('sequelize');
const {sequelize} = require("../db/index.js")

const Questions = sequelize.define('Questions', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
});

module.exports = Questions;