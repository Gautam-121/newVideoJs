const {  DataTypes } = require('sequelize') 
const { sequelize } = require("../db/index.js")
const Client = require("./client.models.js")

const Feedback = sequelize.define('Feedback', {
  isStartServey:{
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isEndSurvey:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  response: {
    type: DataTypes.ARRAY(DataTypes.JSONB), // Use JSONB type for PostgreSQL
    defaultValue: [], // Default value for the array
  }
});

Feedback.belongsTo(Client,{
    foreignKey:"clientId",
    as: "clientRes"
})





module.exports = Feedback;

