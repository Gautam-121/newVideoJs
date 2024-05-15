const Client = require("../models/client.models");
const Feedback = require("../models/feedback.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const Video = require("../models/video.models.js")
const Analytic = require("../models/analytic.models.js")
const sendEmail = require("../utils/sendEmail.js")
const { Op } = require('sequelize');
const { isValidEmail } = require("../utils/validator.js");


const registerLogin = asyncHandler(async(req,res,next)=>{

    const { email } = req.body

    if(!email){
        return next(
            new ErrorHandler(
                "email is required"
            )
        )
    }

    if(!isValidEmail(email)){
        return next(
            new ErrorHandler(
                "Invalid email id",
                400
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

    if(!isValidEmail(email)){
        return next(
            new ErrorHandler(
                "Invalid email id",
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

    const accessToken = await user.generateToken()

    return res.status(200).json({
        success: true,
        message: "Authentication successful",
        user,
        accessToken
    })
 
})

const socialLogin = asyncHandler(async(req,res,next)=>{

    const { email } = req.body

    if(!email){
        return next(
            new ErrorHandler(
                "Email is required",
                 400
            )
        )
    }

    if(!isValidEmail(email)){
        return next(
            new ErrorHandler(
                "Invalid email id",
                400
            )
        )
    }

    const existingClient = await Client.findOne({
        where:{
            email: email.trim()
        }
    })

    if(existingClient){

        const accessToken = await existingClient.generateToken()

        return res.status(200).json({
            success: true,
            message: "Authentication successfull",
            user: existingClient,
            accessToken
        })
    }

    const user = await Client.create({
        email
    })

    if(!user){
        return next(
            new ErrorHandler(
                "Something went wrong while registering the client",
                500
            )
        )
    }

    const accessToken = await user.generateToken()

    return res.status(200).json({
        success: true,
        message: "Authentication successfull",
        user,
        accessToken
    })
})

const storeFeedback = asyncHandler(async(req,res,next)=>{

  const {  response } = req.body;

  console.log(req.body)
  console.log(response)

  if(!req.params.videoId){
    return next(
        new ErrorHandler(
            "videoId is missing"
        )
    )
  }

  if (!response || response.length == 0) {
    return next(
        new ErrorHandler(
            "Provide all fields", 
            400
        )
    );
  }

  const videoQuestion = await Video.findByPk(req.params.videoId);

  if(!videoQuestion){
    return next(
        new ErrorHandler(
            "Video Data not found",
            404
        )
    )
  }

  const isResponseAlreadyExist = await Video.findOne({
    where: {
        video_id: req.params.videoId
    },
    attributes: ['video_id'], // Include only the video_id field
    include: [
        {
            model: Feedback,
            as: 'feedback', // Alias for the association with Video model
            where: {
                clientId: req.user.id // Filtering by clientId
            },
            attributes: { exclude: ['videoId', 'createdAt', 'updatedAt', 'id'] } // Exclude the videoId field inside the Feedback model
        }
    ]
});


  if(isResponseAlreadyExist){
    return next(
        new ErrorHandler(
            "Response i have alredy stored",
            409
        )
    )
  }

  const analyticResponse = await Analytic.findOne({
    where: {
      videoId: req.params.videoId,
    },
  });


  if (analyticResponse) {
    console.log("line 317" , response)
    response.forEach((res) => {
      const questionToUpdate = analyticResponse.analyticData.find(
        (item) => item.id === res.id
      );

      if (questionToUpdate) {
        if (res.skip) {
          questionToUpdate["noOfSkip"]++;
        } else {
            console.log("line 327" , response)
          res.ans.forEach((answer) => {
            if (questionToUpdate.responses.hasOwnProperty(answer)) {
              questionToUpdate.responses[answer]++;
            }
          });
        }
      }
    });

    await Analytic.update(
        { 
            totalResponse: analyticResponse.totalResponse + 1,
            analyticData: analyticResponse.analyticData
        },
        {
            where:{
                id : analyticResponse.id
            },
        }
    );

   await Feedback.create({
      clientId: req.user.id,
      videoId: req.params.videoId,
      response: response,
    });

    return res.status(200).json({
      success: true,
      message: "Feedback received successfully",
    });
  }

  const processedData = videoQuestion.videoData.map((question) => {
    const responses = {};
    console.log("line 363" , responses)
    question.answers.forEach((answer) => {
      responses[answer.answer] = 0;
    });

    return {
      id: question.id,
      question: question.question,
      responses: responses,
      multiple: question.multiple,
      skip: question.skip,
      noOfSkip: 0,
    }
  })

  // Update the data based on client response
  response.forEach((res) => {

    const questionToUpdate = processedData.find(
      (item) => item.id === res.id
    )

    if (questionToUpdate) {
      if (res.skip) {
        questionToUpdate["noOfSkip"]++;
      } else {
        res.ans.forEach((answer) => {
          if (questionToUpdate.responses.hasOwnProperty(answer)) {
            questionToUpdate.responses[answer]++;
          }
        });
      }
    }
  });

   await Analytic.create({
    videoId: req.params.videoId,
    analyticData : processedData,
    totalResponse: 1
  });

  const feedbackRes = await Feedback.create({
    clientId: req.user.id,
    videoId: req.params.videoId,
    response: response,
  });

  return res.status(200).json({
    success: true,
    message: "Feedback received successfully",
    feedbackRes: feedbackRes,
  });
})

const getAnalyticFeedbackData = asyncHandler(async(req,res,next)=>{

    // Extract the video ID from the request parameters
    if(!req.params.videoId){
        return next(
            new ErrorHandler(
                "videoId is missing",
                400
            )
        )
    }

    // Query the database to find feedback associated with the given video ID
    const data = await Analytic.findOne({
        where:{
             videoId : req.params.videoId
        }
    });
    
    if(!data){
        return next(
            new ErrorHandler(
                "No data found with videoId",
                404
            )
        )
    }

    // Return the feedback as a response
    res.status(200).json({
        success: true,
        message: "Data send successfully",
        data
    });
})

module.exports = {
    registerLogin,
    verifyOtp,
    storeFeedback,
    getAnalyticFeedbackData,
    socialLogin
}