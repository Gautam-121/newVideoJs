const Client = require("../models/client.models");
const Feedback = require("../models/feedback.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const Video = require("../models/video.models.js")
const Analytic = require("../models/analytic.models.js")
const sendEmail = require("../utils/sendEmail.js")
const { Op } = require('sequelize');
const { isValidEmail } = require("../utils/validator.js");
const { IsValidUUID } = require("../constants.js");
const AppBranding = require("../models/adminAppBranding.models.js");
const DeletionRequest = require("../models/facebookDeletionRequest.model.js")
const { sequelize } = require("../db/index.js")
const { v4:UUIDV4 } = require("uuid")



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

    const { email , userId } = req.body

    console.log("Enter 1")

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

    if(!userId){
        return next(new ErrorHandler("userId is missing" , 400))
    }

    console.log("Enter 2")

    const existingClient = await Client.findOne({
        where:{
            email: email.trim(),
            userId: userId
        },
        attributes:{
            exclude:["otp" , "otpExpire"]
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
        email,
        userId
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

const getVideoByClient = asyncHandler(async (req , res , next)=>{

    const {customerId , videoId} = req.params
    
    if(!customerId || !videoId) {
      return next(
        new ErrorHandler(
          "Please send me all required params" ,
           400
        )
      )
    }

    if(!IsValidUUID(customerId) || !IsValidUUID(videoId)){
        return next(new ErrorHandler("Must be a valid UUID", 400))
    }
  
    const videoData = await Video.findOne({
      where: { 
        video_id: videoId,
        createdBy: customerId
      }
    })
    
    if (!videoData) {
      return next(
        new ErrorHandler(
          "Video data not Found",
          404
        )
      )
    }
  
    return res.status(200).json({
      success: true,
      message: "Data Send Successfully",
      data: videoData
    })
})

const storeFeedback = asyncHandler(async (req, res, next) => {
    
    const { response } = req.body;

    if (!req.params.videoId) {
        return next(new ErrorHandler("videoId is missing"));
    }

    if(!IsValidUUID(req.params.videoId)){
        return next(new ErrorHandler("Must be valid UUID", 400))
    }

    if (!response || response.length == 0) {
        return next(new ErrorHandler("Provide all fields", 400));
    }

    const videoQuestion = await Video.findByPk(req.params.videoId);

    if (!videoQuestion) {
        return next(new ErrorHandler("Video Data not found", 404));
    }

    const isResponseAlreadyExist = await Feedback.findOne({
        where: {
            videoId: req.params.videoId,
        },
        include:[
            {
                model: Client,
                as: "clientRes",
                where:{
                    email: req.user.email
                }
            }
        ]
    });

    if (isResponseAlreadyExist) {
        return next(new ErrorHandler("Response already stored", 409));
    }

    let analyticResponse = await Analytic.findOne({
        where: {
            videoId: req.params.videoId,
        },
    });

    if (!analyticResponse) {

        let finalProccessData = []

        videoQuestion.videoData.forEach((item) => {
          const processedData = item.questions ?  item.questions.map((question) => {
            const responses = {};
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
            };
          }) : [];

          finalProccessData = finalProccessData.concat(processedData)
        });

        analyticResponse = await Analytic.create({
            videoId: req.params.videoId,
            analyticData: finalProccessData,
            totalResponse: 0 // Changed to 0 since we will increment it later
        });
    }

    response.forEach((res) => {
        const questionToUpdate = analyticResponse.analyticData.find((item) => item.id === res.id);

        if (questionToUpdate) {
            if (res.skip) {
                questionToUpdate.noOfSkip++;
            } else {
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
            where: {
                id: analyticResponse.id
            }
        }
    );

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
});

const getFeedBack = asyncHandler( async (req , res , next)=>{

    const { videoId } = req.params

    if(!videoId){
        return next(
            new ErrorHandler(
                "Please provide all params field"
            )
        )
    }

    if(!IsValidUUID(videoId)){
        return next(new ErrorHandler("Must be valid UUID", 400))
    }

    const feedbackExist = await Feedback.findOne({
        where: {
            videoId: videoId,
            clientId: req.user.id,
        }
    });

    if(!feedbackExist){
        return next(
            new ErrorHandler(
                "No feedback found",
                404
            )
        )
    }

    return res.status(200).json({
        success: true,
        message: "Data send successfully",
        data: feedbackExist
    })
})

const getAppBrandingByClient = asyncHandler(async(req , res , next)=>{

    if(!req.params.id){
        return next(new ErrorHandler("Missing id" , 400))
    }

    if(!IsValidUUID(req.params.id)){
        return next(new ErrorHandler("Must be valid UUID" , 40))
    }

    const appBranding = await AppBranding.findOne({where:{createdBy : req.params.id}})

    if(!appBranding){
        return next(new ErrorHandler(`appBranding not found with id ${req.params.id}`,404))
    }

    return res.status(200).json({
        success: true,
        message: "Data Send Successfully",
        data: appBranding
    })
})


function parseSignedRequest(signedRequest) {
    const [encodedSig, payload] = signedRequest.split('.', 2);
    const sig = base64UrlDecode(encodedSig);
    const data = JSON.parse(base64UrlDecode(payload));

    return data;
}

function base64UrlDecode(input) {
    return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

const facebookDataDeletion = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {
    const signedRequest = req.body.signed_request;
    const data = parseSignedRequest(signedRequest);

    if (!data) {
      return res.status(400).json({ error: "Invalid signed request" });
    }

    const userId = data?.user_id;

    // Check if there is an existing deletion request for the user
    const existingDeletionRequest = await DeletionRequest.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
      transaction,
    });

    if (existingDeletionRequest) {
      if (existingDeletionRequest.status === "pending") {
        // Return the URL and confirmation code of the existing request if pending
        const statusUrl = `${process.env.BASE_URL}/deletion?id=${existingDeletionRequest.id}`;
        const responseData = {
          url: statusUrl,
          confirmation_code: existingDeletionRequest.confirmationCode,
        };
        return res.json(responseData);
      } else if (existingDeletionRequest.status === "completed") {
        // Delete the user's data again if a completed deletion request exists
        const user = await Client.findOne({ where: { userId }, transaction });
        if (user) {

          await Client.destroy({ where: { userId }, transaction });

          const statusUrl = `${process.env.BASE_URL}/deletion?id=${existingDeletionRequest.id}`;
          const responseData = {
            url: statusUrl,
            confirmation_code: existingDeletionRequest.confirmationCode,
          };
          return res.json(responseData);
        }

      } else if (existingDeletionRequest.status === "user_not_found") {
        // Retry the deletion process for the user if user_not_found status
        await DeletionRequest.destroy({ where: { userId }, transaction });
        // continue with the deletion process
      }
    }

    // Start data deletion for the user
    const user = await Client.findOne({ where: { userId }, transaction });
    let status;
    if (user) {
      await Client.destroy({ where: { userId }, transaction });
      status = "completed";
    } else {
      status = "user_not_found";
    }

    const confirmationCode = UUIDV4(); // Generate a unique code for the deletion request
    const deleteDataCreation = await DeletionRequest.create(
      {
        userId,
        confirmationCode,
        status,
      },
      { transaction }
    );

    await transaction.commit();

    const statusUrl = `${process.env.BASE_URL}/deletion?id=${deleteDataCreation.id}`; // URL to track the deletion
    const responseData = {
      url: statusUrl,
      confirmation_code: confirmationCode,
    };
    res.json(responseData);
  } catch (error) {
    await transaction.rollback();
    console.error("Error processing deletion request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deletionData = async (req, res) => {
    try {
      const { id } = req.query;
  
      // Check if the deletion request ID is provided
      if (!id) {
        return res.status(400).json({ error: 'Deletion request ID is required' });
      }
  
      const deletionRequest = await DeletionRequest.findOne({ where: { id } });
  
      // Check if the deletion request exists
      if (!deletionRequest) {
        return res.status(404).json({ error: 'Deletion request not found' });
      }
  
      // Return the status of the deletion request
      res.status(200).json({
        status: deletionRequest.status, // 'pending', 'completed', 'user_not_found', etc.
        confirmation_code: deletionRequest.confirmationCode,
      });
    } catch (error) {
      // Handle any other errors
      console.error('Error retrieving deletion data:', error);
      res.status(500).json({ error: error || 'Internal server error' });
    }
  };





module.exports = {
    registerLogin,
    verifyOtp,
    storeFeedback,
    socialLogin,
    getFeedBack,
    getVideoByClient,
    getAppBrandingByClient,
    facebookDataDeletion,
    deletionData
}