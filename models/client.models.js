const {sequelize} = require("../db/index.js")
const {DataTypes} = require("sequelize")
const jwt = require("jsonwebtoken")

const Client = sequelize.define("Client",{
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Generate UUID automatically
        primaryKey: true,
    },
    email:{
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    otp:{
        type: DataTypes.STRING,
    },
    otpExpire:{
        type: DataTypes.DATE
    },
    userId:{
        type: DataTypes.STRING,
        unique: true
    }
})

Client.prototype.generateToken = async function(){
    return jwt.sign(
        {
            id: this.id,
            email: this.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    )
}

// Generating Password Reset Token
Client.prototype.getOtp = function () {

    // Define the possible characters for the OTP
    const chars = '0123456789';
    // Define the length of the OTP
    const len = 6;
    let otp = '';
    // Generate the OTP
    for (let i = 0; i < len; i++) {
      otp += chars[Math.floor(Math.random() * chars.length)];
    }
  
    this.otp = otp
    this.otpExpire = Date.now() + 5 * 60 * 1000;
  
    return otp;
};

module.exports = Client