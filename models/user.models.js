const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/index.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const User = sequelize.define("User",{
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [4],
          msg: "Name should have more than 4 character",
        },
        notEmpty: {
          msg: "Name is Required",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Email is Required",
        },
        isEmail: {
          msg: "Email is Invalid , Please enter a valid email address",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password is Required",
        },
      },
    },
    resetOtp: DataTypes.STRING,
    resetOtpExpire: DataTypes.DATE,
  },
  {
    hooks: {
      beforeValidate: (instance, options) => { // instance is a Object of data of user comes
        if (instance.name) {
          instance.name = instance.name.trim();
        }
        if (instance.email) {
          instance.email = instance.email.trim();
        }
      },
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    },
  }
);

User.prototype.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
}

User.prototype.generateAccessToken = async function(){
    return jwt.sign(
        {
            id:this.id,
            email: this.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    )
}

// Generating Password Reset Token
User.prototype.getResetOtp = function () {

  // Define the possible characters for the OTP
  const chars = '0123456789';
  // Define the length of the OTP
  const len = 6;
  let otp = '';
  // Generate the OTP
  for (let i = 0; i < len; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }

  this.resetOtp = otp
  this.resetOtpExpire = Date.now() + 15 * 60 * 1000;

  return otp;
};

User.prototype.generateResetPasswordToken = function (){

  const resetToken = crypto.randomBytes(20).toString("hex")

  // hash the resetPassword and store in database
  this.resetPasswordToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex")

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000

  return resetToken
}


module.exports = User;


