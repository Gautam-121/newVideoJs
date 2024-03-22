const User = require("../models/user.models.js")
const asyncHandler = require("../utils/asyncHandler.js")
const ErrorHandler = require("../utils/errorHandler.js")

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

module.exports = {registerUser , loginUser}