const Client = require("../models/client.models");
const Feedback = require("../models/feedback.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const Video = require("../models/video.models.js")
const sendEmail = require("../utils/sendEmail.js")
const { Op } = require('sequelize');


const registerLogin = asyncHandler(async(req,res,next)=>{

    const { email } = req.body

    if(!email){
        return next(
            new ErrorHandler(
                "email is required"
            )
        )
    }

    const existingClient  = await Client.findOne({
        where:{
            email: email.trim()
        },
    })

    if(existingClient){

        const otp = existingClient.getOtp()
        const message = `Thank you for using VideoFeedback App. To complete your registration process, please use the following One-Time Password (OTP):\n\nOTP: ${otp}\n\nThis OTP is valid for the next 10 minutes. For security reasons, please do not share this OTP with anyone.\n\nIf you did not initiate this request, please ignore this email.`

        await existingClient.save({validate: false})

        try {

            console.log(existingClient)

            await sendEmail({
                email: existingClient.email,
                subject: "Your One-Time Password (OTP) for VideoFeedback App",
                message
            })

            return res.status(200).json({
                success: true,
                message: `Email sent to ${existingClient.email} successfully`,
              });

        } catch (error) {

            existingClient.otp = null
            existingClient.otpExpire = null

            await existingClient.save({validate: false})

            return next(
                new ErrorHandler(
                    "Something went wrong while sending otp to there email",
                    500
                )
            )
        }
    }

    const user = await Client.create({
        email
    })

    if(!user){
        return next(
            new ErrorHandler(
                "Something went wrong while registering client",
                400
            )
        )
    }

    const otp = user.getOtp()
    const message = `Thank you for using VideoFeedback App. To complete your registration process, please use the following One-Time Password (OTP):\n\nOTP: ${otp}\n\nThis OTP is valid for the next 10 minutes. For security reasons, please do not share this OTP with anyone.\n\nIf you did not initiate this request, please ignore this email.`

    await user.save({validate: false})

    try {

         await sendEmail({
            email: user.email,
            subject: "Your One-Time Password (OTP) for VideoFeedback App",
            message
        })

        return res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });

    } 
    catch (error) {

        user.otp = null
        user.otpExpire = null

        await user.save({validate: false})

        return next(
            new ErrorHandler(
                "Something went wrong while sending otp to there email",
                500
            )
        )
    }
})

const verifyOtp = asyncHandler(async(req,res,next)=>{

    const { email, otp } = req.body;

    if(!email || !otp){
        return next(
            new ErrorHandler(
                "Email and otp is required",
                400
            )
        )
    }

    const user = await Client.findOne({
        where:{
            email: email.trim(),
            otp: otp,
            otpExpire:{
                [Op.gt] : Date.now()
            }
        }
    })

    if(!user){
        return next(
            new ErrorHandler(
                "Invalid otp",
                400
            )
        )
    }

    if(user.otp != otp){
        return new ErrorHandler(
            "Invalid otp",
            400
        )
    }

    user.otp = null
    user.otpExpire = null
    
    await user.save({validate: false})

    return res.status(200).json({
        success: true,
        message: "Authentication successful",
        user
    })
 
})

const storeFeedback = asyncHandler(async(req,res,next)=>{

    const {clientId , videoId , response} = req.body

    const feedbackRes = await Feedback.create({
        clientId: clientId,
        videoId: videoId,
        response: response
    })

    return res.status(200).json({
        success: true,
        feedbackRes : feedbackRes
    })
})

const getFeedback = asyncHandler(async(req,res,next)=>{

    // Extract the video ID from the request parameters
    const { videoId } = req.params;

    // Query the database to find feedback associated with the given video ID
    const data = await Video.findOne({
        where:{
             video_id : videoId
        },
        attributes: ['video_id'], // Include only the video_id field
        include: [
            {
                model: Feedback,
                as: 'feedback', // Alias for the association with Video model
                attributes: { exclude: ['videoId',"createdAt","updatedAt","id"] } // Exclude the videoId field inside the Feedback model

            }
        ]
    });
    

    // Return the feedback as a response
    res.status(200).json({
        success: true,
        data
    });
})

module.exports = {
    registerLogin,
    verifyOtp,
    storeFeedback,
    getFeedback
}