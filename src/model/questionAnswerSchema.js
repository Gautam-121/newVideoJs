const { DataTypes } = require('sequelize');
const database = require("../config/database.js")

const QuestionAnswerModel = database.define('UserData', {
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

module.exports = QuestionAnswerModel;