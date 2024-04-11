const User = require("../models/user.models.js")
const asyncHandler = require("../utils/asyncHandler.js")
const ErrorHandler = require("../utils/errorHandler.js")
const sendEmail = require("../utils/sendEmail");
const { Op } = require('sequelize');
const {PASSWORD_REGEX} = require("../constants.js")
const {
  isValiLengthName,
  isValidEmail,
  isValidPassword
} = require("../utils/validator.js")
const crypto = require("crypto")

const registerUser = asyncHandler(async(req,res,next)=>{

    const { name , email ,password } = req.body

    if (
        [name,email,password].some((field) => field?.trim() === "")
    ) {
        return next(
            new ErrorHandler(
              "All fields are required", 
              400
            )
        )
    }

    if(!isValidEmail(email)){
      return next(
        new ErrorHandler(
          "Invalid Email Address",
          400
        )
      )
    }

    if(!isValidPassword(password)){
      return next(
        new ErrorHandler(
          "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number and one special character",
          400
        )
      )
    }

    if(!isValiLengthName(name)){
      return next(
        new ErrorHandler(
          "Name should be greater than 4 character",
          400
        )
      )
    }

    const existedUser = await User.findOne({
        where:{
            email:email.trim()
        }
    })

    if(existedUser){
        return next(
            new ErrorHandler(
              "User with email already exists",
              409
            )
        )
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
            new ErrorHandler(
              "Please enter email and password", 
              400
            )
        )
    }

    if(!isValidEmail(email)){
      return next(
        new ErrorHandler(
          "Invalid Email Address",
          400
        )
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

    if(!user){
        return next(
            new ErrorHandler(
              "User does not exist",
              404
            )
        )
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        return next(
            new ErrorHandler(
              "Invalid user credentials",
              401
            )
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

// Forgot Password Token
const forgotPasswordToken = asyncHandler(async (req, res, next) => {

  const {email} = req.body
 
    if(!email){
        return next(
            new ErrorHandler(
              "missing email id",
              400
            )
        )
    }

    if(!isValidEmail(email)){
      return next(
        new ErrorHandler(
          "Invalid email Address",
          400
        )
      )
    }
    
    // Find the user by email
    const user = await User.findOne({
      where: {
        email: email.trim(),
      },
    });
  
    if (!user) {
        return next(
            new ErrorHandler(
              "User not found", 
              404
            )
        );
    }

    // Get ResetPassword Token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    const resetPasswordUrl = `${req.protocol}://${req.get(
    "host")}/api/v1/user/password/reset/${resetToken}`;

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

      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
  
      await user.save();

      return next(
        new ErrorHandler(
          error.message, 
          500
        )
      );
    }
});

const restPasswordTokenVerify = asyncHandler(async(req,res,next)=>{

  const { token } = req.params

  if(!token){
    return next(
      new ErrorHandler(
        "Token is missing",
        400
      )
    )
  }

  const incomingResetToken = crypto
  .createHash("sha256")
  .update(token)
  .digest("hex")

  const user = await User.findOne({
    where:{
      resetPasswordToken: incomingResetToken,
      resetPasswordExpire: {
        [Op.gt] : Date.now()
      }
    }
  })

  if(!user){
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    )
  }

  user.resetPasswordToken = null
  user.resetPasswordExpire = null
  await user.save()

  return res.redirect(301, 'https://www.google.com');
})

// Forgot Password
const forgotPassword = asyncHandler(async (req, res, next) => {

  const {email} = req.body
 
    if(!email){
        return next(
            new ErrorHandler(
              "missing email id",
              400
            )
        )
    }

    if(!isValidEmail(email)){
      return next(
        new ErrorHandler(
          "Invalid email Address",
          400
        )
      )
    }
    
    // Find the user by email
    const user = await User.findOne({
      where: {
        email: email.trim(),
      },
    });
  
    if (!user) {
        return next(
            new ErrorHandler(
              "User not found", 
              404
            )
        );
    }

    // Get ResetPassword Token
    const otp = user.getResetOtp();

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
        new ErrorHandler(
          error.message, 
          500
        )
      );
    }
  });

const verifyOtp = asyncHandler(async (req, res, next) => {

  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(
      new ErrorHandler(
        "Please send Otp and email",
        400
      )
    );
  }

  // Find user by reset password OTP and ensure it hasn't expired
  const user = await User.findOne({
    where: {
      email: email.trim(),
      resetOtp: otp,
      resetOtpExpire: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    return next(
        new ErrorHandler(
          "OTP is invalid or has been expired", 
          401
        )
    );
  }

  if (user.resetOtp !== otp) {
    return next(
      new ErrorHandler(
        "Invalid Otp",
        401
      )
    )
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

    const {email , password } = req.body

    // Find user by reset password token and ensure it hasn't expired
    const user = await User.findOne({
        where: {
            email: email.trim()
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

    if(!password){
        return next(
            new ErrorHandler(
                "Password is  requird", 
                400
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
  
    const accessToken = await user.generateAccessToken()

    user.password = password
    await user.save();

    return res.status(200).json({
        success: true,
        data: user,
        accessToken: accessToken
    })
});

const changePassword = asyncHandler( async(req,res,next)=>{

  const { oldPassword , password } = req.body

  if(!oldPassword || !password){
    return next(
      new ErrorHandler(
        "OldPassword and Password is requird"
      )
    )
  }

  if(!isValidPassword(password)){
    return next(
      new ErrorHandler(
        "Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, and one number and one special character",
        400
      )
    )
  }
  
  const user = await User.findByPk(req.user.id)

  if(!user){
    return next(
      new ErrorHandler(
        "User not found",
        404
      )
    )
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    return next(
      new ErrorHandler(
        "Invalid old password",
        400
      )
    )
  }

  user.password = password
  await user.save({validate: false})

  return res.status(200).json({
    success: true,
    message: "Password change successfully"
  })
})

module.exports = {
    registerUser , 
    loginUser , 
    forgotPassword,
    resetPassword,
    verifyOtp,
    changePassword
}