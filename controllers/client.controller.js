const Client = require("../models/client.models");
const Feedback = require("../models/feedback.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const Video = require("../models/video.models.js")
const Analytic = require("../models/analytic.models.js")
const sendEmail = require("../utils/sendEmail.js")
const { Op, where } = require('sequelize');
const { isValidEmail } = require("../utils/validator.js");
const { IsValidUUID } = require("../constants.js");
const AppBranding = require("../models/adminAppBranding.models.js");
const DeletionRequest = require("../models/facebookDeletionRequest.model.js")
const { sequelize } = require("../db/index.js")
const { v4:UUIDV4 } = require("uuid");
const PlanRestrict = require("../models/planrestrict.model.js");
const ejs = require('ejs');
const { default: axios } = require("axios");
const path = require("path")


// Helper function for decoded signRequest by facebook
function parseSignedRequest(signedRequest) {
    const [encodedSig, payload] = signedRequest.split('.', 2);
    const sig = base64UrlDecode(encodedSig);
    const data = JSON.parse(base64UrlDecode(payload));

    return data;
}

function base64UrlDecode(input) {
    return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

// Helper email function for sending limit riched notification
const notifyUserApproachingVideoLimit = async (user, video) => {
    try {
      // Render the EJS template with dynamic data
      const templatePath = path.join(__dirname, '../views/videoLimitNotification.ejs');
      const limitReachedTemplate = await ejs.renderFile(templatePath, {
        userName: user.email,
        video: {
            videoId: video.videoId,
            title: video.title
        },
        upgradeLink: 'https://main--saas-subscription.netlify.app' // Replace with your actual upgrade link
      });
  
      const options = {
        email: user.email ,
        subject: 'Approaching Video Response Limit',
        message: limitReachedTemplate
      }
  
      // Send the notification email
      await sendEmail(options);
    } catch (error) {
      console.error('Error notifying user:', error);
    }
};

// handler function to get User subscription
const getUserSubscriptions = async (apiKey, userId, res) => {
    try {

      const SAAS_API_URL = "https://stream.xircular.io/api/v1/subscription/getSubscriptionByApiKey"
      const subscriptionResponse = await axios.get(`${SAAS_API_URL}`, {
        headers: {
          'X-API-Key': apiKey || "835aa9fd7263034ee1ebb8d61a8d43f9757a0fe962408e512447002daafff6c4"
        },
      });
      
      if(!subscriptionResponse ||  subscriptionResponse.data.length == 0){
        return false
      }
  
      return subscriptionResponse.data[0] 
    } catch (error) {
      console.error('Error fetching user subscription:', error.message);
      return false
    }
}

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
        await existingClient.save({validate: false})

        // Render the EJS template
        const templatePath = path.join(__dirname, '../views/otpNotifications.ejs');
        const otpTemplate = await ejs.renderFile(templatePath, { otp: otp });

        try {

            await sendEmail({
                email: existingClient.email,
                subject: "Your One-Time Password (OTP) for VideoFeedback App",
                message: otpTemplate
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
            email: email.trim(),
        },
        attributes:{
            exclude:["otp" , "otpExpire"]
        }
    })

    if(existingClient){

        if(userId){
            existingClient.userId = userId
            await existingClient.save({validate: false})
        }

        const accessToken = await existingClient.generateToken()

        return res.status(200).json({
            success: true,
            message: "Authentication successfull",
            user: existingClient,
            accessToken
        })
    }

    const user = await Client.create({
        email: email,
        userId: userId
    })


    const userCreate = await Client.findByPk(user.id,{
        attributes:{
            exclude:["otp" , "otpExpire"]
        }
    })

    if(!userCreate){
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
        userCreate,
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
    
    if (!videoData || videoData.isDeleted) {
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
    const transaction = await sequelize.transaction();
    try {
        const { response } = req.body;

        if (!req.params.videoId) {
            return next(new ErrorHandler("videoId is missing", 400));
        }

        if(!req.params.apiKey){
            return next(new ErrorHandler("Misiing Api key", 400))
        }

        if (!IsValidUUID(req.params.videoId)) {
            return next(new ErrorHandler("Must be valid UUID", 400))
        }

        if (!response || response.length == 0) {
            return next(new ErrorHandler("Provide all fields", 400))
        }

        const videoQuestion = await Video.findByPk(req.params.videoId, { transaction });

        if (!videoQuestion || videoQuestion.isDeleted) {
            return next(new ErrorHandler("Video Data not found", 404))
        }

        const isResponseAlreadyExist = await Feedback.findOne({
            where: {
                videoId: req.params.videoId,
            },
            include: [
                {
                    model: Client,
                    as: "clientRes",
                    where: {
                        email: req.user.email
                    }
                }
            ],
            transaction
        });

        if (isResponseAlreadyExist) {
            return next(new ErrorHandler("Response already stored", 409))
        }

        let analyticResponse = await Analytic.findOne({
            where: {
                videoId: req.params.videoId,
            },
            transaction
        });

        if (!analyticResponse) {
            let finalProccessData = []

            videoQuestion.videoData.forEach((item) => {
                const processedData = item.questions ? item.questions.map((question) => {
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

                finalProccessData = finalProccessData.concat(processedData);
            });

            analyticResponse = await Analytic.create({
                videoId: req.params.videoId,
                analyticData: finalProccessData,
                totalResponse: 0 // Changed to 0 since we will increment it later
            }, { transaction });
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

        // fetch User subscription
        const subscription = await getUserSubscriptions(req.params.apiKey, videoQuestion.createdBy, res);
        console.log("subscription" , subscription)
        if (!subscription) {
            return next(new ErrorHandler("User subscription not found", 400))
        }

        console.log("videoQuestion" , videoQuestion)
        const videoLength = videoQuestion.videoLength / 60;

        // Subscription under trial-period
        if (subscription.isTrialActive) {
            console.log("Enter inside trial period")
            if (new Date() > new Date(subscription.trialEndDate)) {
                return next(new ErrorHandler("Free trial has expired, please renew the plan", 400));
            }

            let earlyExpiredPlan = await PlanRestrict.findOne({
                where: {
                    videoId: req.params.videoId,
                },
                transaction
            });

            if (!earlyExpiredPlan) {
                earlyExpiredPlan = await PlanRestrict.create({
                    videoId: req.params.videoId,
                    plans: [
                        {
                            planId: "Free Plan",
                            totalUsedResponses: 0,
                            expired: subscription.trialEndDate,
                            maxLimit: subscription.freeTrialFeature.totalResponse
                        }
                    ]
                }, { transaction });
            }

            // Checked plan has riched limit
            if (earlyExpiredPlan.plans[0].totalUsedResponses >= Math.ceil(subscription.freeTrialFeature.totalResponse / videoLength)) {
                return next(new ErrorHandler("Plan limit has exceeded, please renew your plan", 400))
            }

            await Analytic.update(
                {
                    totalResponse: analyticResponse.totalResponse + 1,
                    analyticData: analyticResponse.analyticData
                },
                {
                    where: {
                        id: analyticResponse.id
                    },
                    transaction
                }
            );

            const feedbackRes = await Feedback.create({
                clientId: req.user.id,
                videoId: req.params.videoId,
                response: response,
            }, { transaction });

            earlyExpiredPlan.plans[0].totalUsedResponses += 1;
            earlyExpiredPlan.changed('plans', true);
            await earlyExpiredPlan.save({ validate: false, transaction });

            // checked plan has riched 90% of there overvall limit
            if ((Math.ceil(subscription.freeTrialFeature.totalResponse / videoLength) - earlyExpiredPlan.plans[0].totalUsedResponses) <= Math.ceil(((subscription.freeTrialFeature.totalResponse + 1) / videoLength) * 0.1)) {
                await notifyUserApproachingVideoLimit(subscription, videoQuestion);
            }

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: "Feedback received successfully",
                feedbackRes: feedbackRes,
            });
        }

        if (subscription?.subscriptions.length == 0) {
            return next(new ErrorHandler("No active plan found", 400))
        }

        const currentDate = new Date();
        let activePlans = subscription.subscriptions
            .filter(plan => new Date(plan.endDate) >= currentDate)
            .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

        if (activePlans.length === 0) {
            return next(new ErrorHandler("No active plan found", 400))
        }

        let earlyExpiredPlan = await PlanRestrict.findOne({
            where: {
                videoId: req.params.videoId,
            },
            transaction
        });

        if (!earlyExpiredPlan) {
            earlyExpiredPlan = await PlanRestrict.create({
                videoId: req.params.videoId,
                plans: [
                    {
                        planId: activePlans[0].id,
                        totalUsedResponses: 0,
                        expired: activePlans[0].endDate,
                        maxLimit: activePlans[0].features.totalResponse
                    }
                ]
            }, { transaction });
        }
    
    earlyExpiredPlan.plans.sort((a, b) => new Date(a.expired) - new Date(b.expired));
    const findFirstValidPlan = (earlyExpiredPlan, activePlans, videoLength) => {
      let isLimitReached = false;
      for (let i = 0; i < activePlans.length; i++) {
        const planExist = earlyExpiredPlan.plans.find(
          (plan) => plan.planId === activePlans[i].id
        );
        const hasReachedTheLimit = planExist
          ? planExist.totalUsedResponses >=
            Math.ceil(planExist.maxLimit / videoLength)
          : null;
        if (planExist && !hasReachedTheLimit) {
          return planExist;
        } else if (!planExist) {
          return null;
        }
      }
      if (isLimitReached) {
        return "Limit Reached";
      }
    };

        // find first valid plan
        let planExist = findFirstValidPlan(earlyExpiredPlan, activePlans, videoLength);

        if(planExist == "Limit Reached"){
            return next(new ErrorHandler("Plan limit has exceeded, please renew your plan", 400))
        }

        if (!planExist) {
            planExist = {
                planId: activePlans[0].id,
                totalUsedResponses: 0,
                expired: activePlans[0].endDate,
                maxLimit: activePlans[0].features.totalResponse
            };
            const existingData = earlyExpiredPlan.plans.filter(plan => new Date() <= new Date(plan.expired));
            existingData.push(planExist);
            earlyExpiredPlan.plans = existingData;
        }

        // From all avtive subscription plan filter those have not riched the limit
        const validActivePlans = activePlans.filter(plan => {
            const earlyPlan = earlyExpiredPlan.plans.find(p => p.planId === plan.id);
            const hasReachedTheLimit = earlyPlan ? earlyPlan.totalUsedResponses >= Math.ceil(earlyPlan.maxLimit / videoLength) : null
            return earlyPlan && !hasReachedTheLimit
        });

        if (validActivePlans.length === 1) {
            const plan = validActivePlans[0];
            const earlyPlan = earlyExpiredPlan.plans.find(p => p.planId === plan.id);

            if (earlyPlan.totalUsedResponses >= Math.ceil(plan.features.totalResponse / videoLength)) {
                return next(new ErrorHandler("Plan limit has exceeded, please renew your plan", 400))
            }

            if ((Math.ceil(plan.features.totalResponse / videoLength) - earlyPlan.totalUsedResponses) <= Math.ceil((plan.features.totalResponse + 1/ videoLength) * 0.1)) {
                await notifyUserApproachingVideoLimit(subscription, videoQuestion);
            }
        }

        await Analytic.update(
            {
                totalResponse: analyticResponse.totalResponse + 1,
                analyticData: analyticResponse.analyticData
            },
            {
                where: {
                    id: analyticResponse.id
                },
                transaction
            }
        );

        console.log("before all plans" , earlyExpiredPlan.plans)

        const feedbackRes = await Feedback.create({
            clientId: req.user.id,
            videoId: req.params.videoId,
            response: response,
        }, { transaction });

        planExist.totalUsedResponses += 1;
        earlyExpiredPlan.changed("plans", true);
        await earlyExpiredPlan.save({ validate: false, transaction });

        console.log("After increament" , earlyExpiredPlan.plans)

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: "Feedback received successfully",
            feedbackRes: feedbackRes,
        });
    } catch (error) {
        await transaction.rollback();
        return next(error instanceof ErrorHandler ? error : new ErrorHandler(error.message, 500));
    }
});


// const storeFeedback = asyncHandler(async (req, res, next) => {
    
//     const { response } = req.body;

//     // if(req.params.apiKey){
//     //     return next(new ErrorHandler("Misiing Api key", 400))
//     // }

//     if (!req.params.videoId) {
//         return next(new ErrorHandler("videoId is missing", 400));
//     }

//     if(!IsValidUUID(req.params.videoId)){
//         return next(new ErrorHandler("Must be valid UUID", 400))
//     }

//     if(!response || response.length == 0) {
//         return next(new ErrorHandler("Provide all fields", 400));
//     }

//     const videoQuestion = await Video.findByPk(req.params.videoId);

//     if (!videoQuestion || videoQuestion.isDeleted) {
//         return next(new ErrorHandler("Video Data not found", 404));
//     }

//     const isResponseAlreadyExist = await Feedback.findOne({
//         where: {
//             videoId: req.params.videoId,
//         },
//         include:[
//             {
//                 model: Client,
//                 as: "clientRes",
//                 where:{
//                     email: req.user.email
//                 }
//             }
//         ]
//     });

//     if (isResponseAlreadyExist) {
//         return next(new ErrorHandler("Response already stored", 409));
//     }

//     let analyticResponse = await Analytic.findOne({
//         where: {
//             videoId: req.params.videoId,
//         },
//     });

//     if (!analyticResponse) {

//         let finalProccessData = []

//         videoQuestion.videoData.forEach((item) => {
//           const processedData = item.questions ?  item.questions.map((question) => {
//             const responses = {};
//             question.answers.forEach((answer) => {
//               responses[answer.answer] = 0;
//             });

//             return {
//               id: question.id,
//               question: question.question,
//               responses: responses,
//               multiple: question.multiple,
//               skip: question.skip,
//               noOfSkip: 0,
//             };
//           }) : [];

//           finalProccessData = finalProccessData.concat(processedData)
//         });

//         analyticResponse = await Analytic.create({
//             videoId: req.params.videoId,
//             analyticData: finalProccessData,
//             totalResponse: 0 // Changed to 0 since we will increment it later
//         });
//     }

//     response.forEach((res) => {
//         const questionToUpdate = analyticResponse.analyticData.find((item) => item.id === res.id);

//         if (questionToUpdate) {
//             if (res.skip) {
//                 questionToUpdate.noOfSkip++;
//             } else {
//                 res.ans.forEach((answer) => {
//                     if (questionToUpdate.responses.hasOwnProperty(answer)) {
//                         questionToUpdate.responses[answer]++;
//                     }
//                 });
//             }
//         }
//     });

//     const subscription =  getUserSubscriptions(req.params.apiKey , videoQuestion.createdBy , res)

//     if(!subscription) {
//         return next(new ErrorHandler("User subscription not found", 400));
//     }

//     // Convert video length from seconds to minutes
//     const videoLength = videoQuestion.videoLength / 60;

//     if(subscription.isTrialActive){
//         if(new Date() > new Date(subscription.trialEndDate)){
//             return next(new ErrorHandler("Free trial has expired, pleased renew the plan", 400))
//         }

//         let earlyExpiredPlan = await PlanRestrict.findOne({
//             where:{
//                 videoId:req.params.videoId,
//             }
//         })
     
//         if(!earlyExpiredPlan){
//             earlyExpiredPlan = await PlanRestrict.create({
//                 videoId: req.params.videoId,
//                 plans:[
//                     {
//                         planId:"Free Plan",
//                         totalUsedResponses:0,
//                         expired: subscription.trialEndDate,
//                         maxLimit: subscription.freeTrialFeature.totalResponse
//                     }
//                 ]
//             })
//         }

//         console.log(earlyExpiredPlan)
//         console.log("VideoLength" , videoLength)
//         console.log(earlyExpiredPlan.plans[0].totalUsedResponses >= Math.ceil(subscription.freeTrialFeature.totalResponse/videoLength))

//         if(earlyExpiredPlan.plans[0].totalUsedResponses >= Math.ceil(subscription.freeTrialFeature.totalResponse/videoLength)){
//             return next(new ErrorHandler("Plan limit has exceed , please renew your plan" , 400))
//         }

//         await Analytic.update(
//             {
//                 totalResponse: analyticResponse.totalResponse + 1,
//                 analyticData: analyticResponse.analyticData
//             },
//             {
//                 where: {
//                     id: analyticResponse.id
//                 }
//             }
//         );
     
//         const feedbackRes = await Feedback.create({
//             clientId: req.user.id,
//             videoId: req.params.videoId,
//             response: response,
//         });
     
//          // Update the total used responses count
//          earlyExpiredPlan.plans[0].totalUsedResponses += 1;
//          plan.changed('plans', true);
//          await earlyExpiredPlan.save({validate: false});

//          let newData = await PlanRestrict.findOne({
//             where:{
//                 videoId:req.params.videoId,
//             }
//         })

//         console.log("newData" , newData.plans)
     
//         // Check if this response brings the user close to their limit across all plans
//         if ((Math.ceil(subscription.freeTrialFeature.totalResponse/videoLength) - earlyExpiredPlan.plans[0].totalUsedResponses) <= Math.ceil(((subscription.freeTrialFeature.totalResponse + 1)/videoLength) * 0.1)) { // 10% or less remaining
//             await notifyUserApproachingVideoLimit(subscription,videoQuestion );
//         }
     
//         return res.status(200).json({
//             success: true,
//             message: "Feedback received successfully",
//             feedbackRes: feedbackRes,
//         });
     
//     }

//     if(subscription?.subscriptions.length == 0){
//         return next(new ErrorHandler("No active plan found", 400))
//     }

//     const currentDate = new Date();

//     // Get all active plans, sorted by expiration date (earliest first)
//     let activePlans = subscription.subscriptions
//     .filter(plan => new Date(plan.endDate) >= currentDate)
//     .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

//    if(activePlans.length === 0) {
//        return next(new ErrorHandler("No active plan found", 400));
//    }

//    const earlyExpiredPlan = await PlanRestrict.findOne({
//        where:{
//            videoId:req.params.videoId,
//        }
//    })

//    if(!earlyExpiredPlan){
//        earlyExpiredPlan = await PlanRestrict.create({
//            videoId: req.params.videoId,
//            plans:[
//                {
//                    planId:activePlans[0].id,
//                    totalUsedResponses:0,
//                    expired: activePlans[0].endDate,
//                    maxLimit: activePlans[0].features.totalResponse
//                }
//            ]
//        })
//    }

// //    const planExist = earlyExpiredPlan.plans.find(plan => plan.planId === activePlans[0].id)
// //    const planExists = earlyExpiredPlan.plans.find(plan => activePlans.find(active => active.id === plan.planId))
//    earlyExpiredPlan.plans.sort((a, b) => new Date(a.expired) - new Date(b.expired));
//    // Function to find the first plan that matches and hasn't reached the limit
// const findFirstValidPlan = (earlyExpiredPlan, activePlans , videoLength) => {
//     const isLimitReached = false
//     for (let i = 0; i < activePlans.length; i++) {
//       const planExist = earlyExpiredPlan.plans.find(plan => plan.planId === activePlans[i].id);
//       const hasReachedTheLimit = planExist ? planExist.totalUsedResponse >= Math.ceil(planExist.maxLimit / videoLength) : null
//       if (planExist && !hasReachedTheLimit) {
//         return planExist;
//       }else if(!planExist){
//         isLimitReached = true
//         return null
//       }
//     }
//     if(isLimitReached){
//         return "Limit Reached"
//     }
//   };
  
// //    const planExist = earlyExpiredPlan.plans.find(plan => plan.planId === activePlans[0].id)
//    const planExist = findFirstValidPlan(earlyExpiredPlan, activePlans , videoLength);

//    if(planExist === "Limit Reached"){
//     return next(new ErrorHandler("Plan limit has exceed , please renew your plan", 400))
//    }

// //    const planExist = earlyExpiredPlan.plans.find(plan =>
// //     activePlans.find(activePlan => activePlan.id === plan.planId && !(plan.totalUsedResponses >= Math.ceil(activePlans.features.totalResponse/videoLength)))
// //   );

//    if(!planExist){
//     //    activePlans = activePlans.filter(activePlan =>
//     //     !earlyExpiredPlan.plans.some(plan => plan.planId === activePlan.id)
//     //   );

//     //   if(activePlans.length == 0){
//     //     return next(new ErrorHandler("Plan limit has exceed , please renew your plan" , 400))
//     //   }

//     //   activePlans.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

//        planExist = {
//            planId:activePlans[0].id,
//            totalUsedResponses:0,
//            expired: activePlans[0].endDate,
//            maxLimit: activePlans[0].features.totalResponse
//        }
//        const existingData = earlyExpiredPlan.plans.filter(plan => new Date() <= new Date(plan.expired));
//        existingData.push(planExist);

//        // Update the entry with the modified data
//        earlyExpiredPlan.plans = existingData;
//    }
// //    else{
// //     activePlans = activePlans.filter(activePlan =>
// //         !earlyExpiredPlan.plans.some(plan => plan.planId === activePlan.id) // and checked isExpired
// //       );
// //    }

// //    if(activePlans.length == 1 && planExist.totalUsedResponses >= Math.ceil(activePlans[0].features.totalResponse/videoLength)){
// //        return next(new ErrorHandler("Plan limit has exceed , please renew your plan" , 400))
// //    }

//    // Filter out plans that have reached their limit
// const validActivePlans = activePlans.filter(plan => {
//     const earlyPlan = earlyExpiredPlan.plans.find(p => p.planId === plan.id);
//     const hasReachedTheLimit = earlyPlan ? earlyPlan.totalUsedResponse >= Math.ceil(earlyPlan.maxLimit / videoLength) : null
//     return earlyPlan && !hasReachedTheLimit;
//   });
  
//   // If there is only one valid plan and it has reached its limit
//   if (validActivePlans.length === 1) {
//     const plan = validActivePlans[0];
//     const earlyPlan = earlyExpiredPlan.plans.find(p => p.planId === plan.id);
  
//     if (earlyPlan.totalUsedResponses >= Math.ceil(plan.features.totalResponse / videoLength)) {
//       return next(new ErrorHandler("Plan limit has exceed , please renew your plan", 400));
//     }

//     // Check if the user is close to reaching their limit (10% or less remaining)
//     if ((Math.ceil(plan.features.totalResponse / videoLength) - earlyPlan.totalUsedResponses) <= Math.ceil((plan.features.totalResponse / videoLength) * 0.1)) {
//     await notifyUserApproachingVideoLimit(subscription, videoQuestion);
//     }
//   }

//    await Analytic.update(
//        {
//            totalResponse: analyticResponse.totalResponse + 1,
//            analyticData: analyticResponse.analyticData
//        },
//        {
//            where: {
//                id: analyticResponse.id
//            }
//        }
//    );

//    const feedbackRes = await Feedback.create({
//        clientId: req.user.id,
//        videoId: req.params.videoId,
//        response: response,
//    });

//     // Update the total used responses count
//     planExist.totalUsedResponses += 1;
//     earlyExpiredPlan.changed("plans", true)
//     await earlyExpiredPlan.save({validate: false});

// //    // Check if this response brings the user close to their limit across all plans
// //    if (activePlans.length == 1 && (Math.ceil(activePlans[0].features.totalResponse/videoLength) - planExist.totalUsedResponses) <= Math.ceil(((activePlans[0].features.totalResponse + 1)/videoLength) * 0.1)) { // 10% or less remaining
// //        await notifyUserApproachingVideoLimit(subscription,videoQuestion );
// //    }

//    return res.status(200).json({
//        success: true,
//        message: "Feedback received successfully",
//        feedbackRes: feedbackRes,
//    });
// });

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

    const videoExist = await Video.findByPk(videoId)

    if(!videoExist || videoExist.isDeleted){
        return next(new ErrorHandler(`Video not exist with id ${videoId}`, 400))
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

        await transaction.commit();
        return res.json(responseData);
      } else if (existingDeletionRequest.status === "completed") {
        // Delete the user's data again if a completed deletion request exists
        const user = await Client.findOne({ where: { userId }, transaction });
        console.log(user)
        if (user) {

          await Client.destroy({ where: { userId : userId }, transaction });

          const statusUrl = `${process.env.BASE_URL}/deletion?id=${existingDeletionRequest.id}`;
          const responseData = {
            url: statusUrl,
            confirmation_code: existingDeletionRequest.confirmationCode,
          };
          await transaction.commit();
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