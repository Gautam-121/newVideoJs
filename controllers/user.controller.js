const User = require("../models/user.models.js")
const asyncHandler = require("../utils/asyncHandler.js")
const ErrorHandler = require("../utils/errorHandler.js")
const sendEmail = require("../utils/sendEmail");
const { Op } = require('sequelize');
const {PASSWORD_REGEX} = require("../constants.js")


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

    if(!PASSWORD_REGEX.test(password)) {
      return next(
        new ErrorHandler(
          "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number and one special character",
          400
        )
      );
    }

    const user = await User.create({
        name,
        email,
        password
    })

    const createdUser = await User.findByPk(user.id,{
      attributes:{
        exclude: ["resetOtp","resetOtpExpire"]
      }
    })

    if(!createdUser){
      return next(
        new ErrorHandler(
          "Something went wrong while creating the User registration",
          500
        )
      )
    }

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
            email:email.trim(),
        },
        attributes: {
          exclude: ['resetOtp', 'resetOtpExpire']
        }
    })

    if(!PASSWORD_REGEX.test(password)) {
        return next(
          new ErrorHandler(
            "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number and one special character",
            400
          )
        );
      }

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
    const otp = user.getResetOtp();
    console.log("otp" , otp)
    await user.save();
    const message = `Your One Time Password is ${otp}`;
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
      user.resetOtp = null;
      user.resetOtpExpire = null;
  
      await user.save();

      return next(
        new ErrorHandler(error.message, 500)
        );
    }
  });

const verifyOtp = asyncHandler(async (req, res, next) => {

  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("Please send Otp and email"));
  }

  // Find user by reset password OTP and ensure it hasn't expired
  const user = await User.findOne({
    where: {
      email: email,
      resetOtp: otp,
      resetOtpExpire: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    return next(
        new ErrorHandler("OTP is invalid or has been expired", 400));
  }

  if (user.resetOtp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  user.resetOtp = null;
  user.resetOtpExpire = null;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

// Reset Password
const resetPassword = asyncHandler(async (req, res, next) => {

    const {email , password , confirmPassword} = req.body

    // Find user by reset password token and ensure it hasn't expired
    const user = await User.findOne({
        where: {
            email: email
        },
        attributes: {
          exclude: ['resetOtp', 'resetOtpExpire']
        }
      });
  
    if (!user) {
      return next(
        new ErrorHandler(
          "User not found",
          404
        )
      );
    }

    if(!password || !confirmPassword){
        return next(
            new ErrorHandler(
                "Please send Password and confirmPassword", 400
            )
        )
    }

    if(!PASSWORD_REGEX.test(password)) {
        return next(
          new ErrorHandler(
            "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number and one special character",
            400
          )
        );
      }
  
    // Check if passwords match
    if (password !== confirmPassword) {
        return next(
            new ErrorHandler("Passwords do not match", 400)
        );
    }
  
    user.password = password
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
    resetPassword,
    verifyOtp
}