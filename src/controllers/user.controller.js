const User = require("../models/user.models.js")
const asyncHandler = require("../utils/asyncHandler.js")
const ErrorHandler = require("../utils/errorHandler.js")
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { Op } = require('sequelize');

const registerUser = asyncHandler(async(req,res,next)=>{

    const { name , email ,password } = req.body

    if (
        [name,email,password].some((field) => field?.trim() === "")
    ) {
        return next(
            new ErrorHandler("All fields are required", 400)
        )
    }

    const existedUser = await User.findOne({
        where:{
            email:email
        }
    })

    if(existedUser){
        return next(
            new ErrorHandler("User with email already exists",409)
        )
    }

    const createdUser = await User.create({
        name,
        email,
        password
    })

    return res.status(201).json({
        success: true,
        message: "User registration Successfully",
        createdUser
    })
} )

const loginUser =  asyncHandler(async(req,res,next)=>{

    const {email , password} = req.body

    if(!(email && password)){
        return next(
            new ErrorHandler("Please enter email and password", 400)
        )
    }

    const user = await User.findOne({
        where:{
            email:email.trim()
        }
    })

    if(!user){
        return next(
            new ErrorHandler("User does not exist",404)
        )
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        return next(
            new ErrorHandler("Invalid user credentials",401)
        )
    }

    const accessToken = await user.generateAccessToken()

    return res.status(200).json({
        success: true,
        message: "User logged In Successfully",
        data: user,
        accessToken: accessToken
    })
})

// Forgot Password
const forgotPassword = asyncHandler(async (req, res, next) => {

    if(!req.body.email){
        return next(
            new ErrorHandler("missing email id",400)
        )
    }

    // Find the user by email
    const user = await User.findOne({ 
        where: { 
            email : req.body.email
        } });
  
    if (!user) {
        return next(
            new ErrorHandler("User not found", 404)
        );
      }
  
    // Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();
  
    await user.save();
  
    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/password/reset/${resetToken}`;
  
    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: `Password Recovery`,
        message,
      });
  
      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
  
      await user.save();
  
      return next(
        new ErrorHandler(error.message, 500)
        );
    }
  });

// Reset Password
const resetPassword = asyncHandler(async (req, res, next) => {

    if(!req.params.token){
        return next(
            new ErrorHandler("Token is missing",400)
        )
    }
    // creating token hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
  
    // Find user by reset password token and ensure it hasn't expired
    const user = await User.findOne({
        where: {
          resetPasswordToken,
          resetPasswordExpire: { [Op.gt]: new Date() }
        }
      });
  
    if (!user) {
      return next(
        new ErrorHandler(
          "Reset Password Token is invalid or has been expired",
          400
        )
      );
    }

    if(!req.body.password || !req.body.confirmPassword){
        return next(
            new ErrorHandler(
                "Please send Password and confirmPassword", 400
            )
        )
    }
  
    // Check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
        return next(new Error("Passwords do not match"));
    }
  
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
  
    const accessToken = await user.generateAccessToken()

    return res.status(200).json({
        success: true,
        data: user,
        accessToken: accessToken
    })
  });

module.exports = {
    registerUser , 
    loginUser , 
    forgotPassword,
    resetPassword
}