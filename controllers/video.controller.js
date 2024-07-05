const Video = require("../models/video.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const fs = require("fs")
const Analytic = require("../models/analytic.models.js")
const OpenAI = require("openai");
const { IsValidUUID } = require("../constants.js");
const axios = require('axios');
const { 
  UPLOAD_VIDEO_URL , 
  HSL_BASE_URL , 
  UPLOAD_VIDEO_FOLDER,
  LOCAL_VIDEO_STORAGE_BASE_URL,
  SUBSCRIPTION_API
 } = require("../constants.js")
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
 
ffmpeg.setFfmpegPath(ffmpegPath);


const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// handler function to check plan expiry
async function checkPlanExpired(bearerToken , res) {
  try {

    // Make a request to the subscription management server to fetch the user's subscription details
    const subscriptionResponse = await axios.get(`${SUBSCRIPTION_API}`,{
      headers: {
        'Authorization': `${bearerToken}`
      }
    });

    if(!subscriptionResponse ||  subscriptionResponse.length == 0){
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      })
    }

    if(subscriptionResponse.data[0].isTrialActive){
      return subscriptionResponse.data[0] 
    }

    // Get all Active Plan
    const activeSubscriptions = subscriptionResponse.data[0].subscriptions
    .filter( plan => new Date(plan.startDate) <= new Date() && new Date(plan.endDate) >= new Date())

    if(activeSubscriptions.length == 0){
      res.status(400).json({
        success: false,
        message: "Please renew your subscription plan. Your current subscription is expired."
      });      
    }

    // Get all Plan Hierarchy
    const planHierarchy = [...new Set(activeSubscriptions.map(plan => plan.plan))];
    return activeSubscriptions.reduce((highest, current) => 
      planHierarchy.indexOf(current.plan) > planHierarchy.indexOf(highest.plan) ? current : highest
    );
    
  } catch (error) {
    console.error('Error checking subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while fetching the subscription"
    });
  }
}

const UPLOAD_DELAY_MS = 5000; // 5-second delay to allow CDN processing
// Function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// CREATING UPLOADMEDIA DATA
const createVideoData = asyncHandler(async (req, res, next) => {5

  const data = JSON.parse(JSON.stringify(req.body));

  if(!data.title || !data.videoSelectedFile || !data.videoData || !data.videoFileUrl){
    return next(
      new ErrorHandler(
        "All field are required",
        400
      )
    )
  }

  if(!data.videoLength || typeof data.videoLength !== "number"){
    return next(
      new ErrorHandler(
        "VideoLength is required and must be number",
         400
      )
    )
  }

  const video = await Video.create({
    ...data,
    createdBy: req.user?.obj?.id
  });

  const videoData = await Video.findByPk(video.video_id)

  if(!videoData){
    return next(
      new ErrorHandler(
        "Something went wrong while creating the data", 
        500
      )
    )
  }

  return res.status(201).json({
    success: true,
    message: "Video Data Created Successfully",
    videoData,
  });
})

const uploadVideo = async (req, res, next) => {
  try {

    const videoFilePath = req?.file;

    if (!videoFilePath) {
      return next(new ErrorHandler("Missing Video File. Provide a video file.", 400));
    }

    const data = {
      url: `${LOCAL_VIDEO_STORAGE_BASE_URL}/video/${videoFilePath.filename}`,
      filename: videoFilePath.filename,
      folder: UPLOAD_VIDEO_FOLDER,
    };

    // Upload the video file to the CDN
    const uploadVideoFileOn5centCdn = await axios.post(UPLOAD_VIDEO_URL, data, {
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.CDN_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log('Video uploaded to CDN, response:', uploadVideoFileOn5centCdn.data);

    // Construct the video URL from the CDN response
    const videoUrl = `${HSL_BASE_URL}/${UPLOAD_VIDEO_FOLDER}/${uploadVideoFileOn5centCdn.data.filename}/playlist.m3u8`;

    console.log('Generated video URL:', videoUrl);

    // Introduce a delay to allow the CDN to process the upload
    console.log(`Waiting ${UPLOAD_DELAY_MS / 1000} seconds for CDN processing...`);
    await delay(UPLOAD_DELAY_MS);

    // Verify that the video exists on the CDN
    const verifyUrl = `https://api.5centscdn.com/v2/zones/vod/push/3987/filemanager/info?file=videoCampaign%2F${videoFilePath.filename}&media=1`;
    console.log(`Verifying the video exists on the CDN with URL: ${verifyUrl}`);
    const verifyResponse = await axios.get(verifyUrl, {
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.CDN_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log('Verification response:', verifyResponse.data);
    if (!verifyResponse.data.media) {
      if (fs.existsSync(videoFilePath.path)) {
        fs.unlinkSync(videoFilePath.path);
        console.log(`Successfully deleted local file: ${videoFilePath.path}`);
      }
      throw new Error('Failed to verify the uploaded video on CDN.');
    }

    // Safely delete the file from local storage after verifying upload to the CDN
    console.log('Deleting local file:', videoFilePath.path);
    try {
      if (fs.existsSync(videoFilePath.path)) {
        fs.unlinkSync(videoFilePath.path);
        console.log(`Successfully deleted local file: ${videoFilePath.path}`);
      }
    } catch (unlinkError) {
      console.error(`Failed to delete the local file: ${unlinkError.message}`);
      return next(new ErrorHandler("Video uploaded but failed to delete the local file.", 500));
    }

    return res.status(201).json({
      success: true,
      message: "Video Uploaded Successfully",
      videoUrl: videoUrl,
    });
  } catch (error) {
    console.error('Error during video upload process:', error.message);

    // Handle errors and attempt to delete the local file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`Successfully deleted local file during error handling: ${req.file.path}`);
      } catch (unlinkError) {
        console.error(`Failed to delete the local file during error handling: ${unlinkError.message}`);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while uploading the video",
    });
  }
};

const uploadThumb= async(req , res , next)=>{
  try {

    const thumbnailFilePath = req?.file?.filename;

  // const videoLocalFilePath = req?.files?.["video"]?.[0]?.path
  // if(!videoLocalFilePath){
  //   return next(
  //     new ErrorHandler(
  //       "Missing Video File , Provide video file",
  //        400
  //     )
  //   )
  // }

  // const uploadFileOnAwsS3 = await uploadFileToS3(videoLocalFilePath)

  // if(!uploadFileOnAwsS3){
  //   return next(
  //     new ErrorHandler(
  //       "Something went wrong while uploding file on Aws s3 cloud",
  //        500
  //     )
  //   )
  // }

  // return res.status(201).json({
  //   success: true,
  //   message: "Video Uploaded Successfully",
  //   videoUrl: uploadFileOnAwsS3
  // })

  if(!thumbnailFilePath){
    return next(
      new ErrorHandler(
        "Missing Video File , Provide video file",
         400
      )
    )
  }

  return res.status(201).json({
    success:true,
    message:"thumbnail Uploaded Successfully",
    thumbnailUrl: thumbnailFilePath
  })
  } catch (error) {
    if(req.file?.filename){
      fs.unlinkSync(req.file.path)
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while uploading video"
    })
  }
}

// get all created Video Data 
const getAllVideo = asyncHandler(async (req, res, next) => {

  const page = parseInt(req.query.page) || 1; // default to page 1 if not provided
  const pageSize = parseInt(req.query.pageSize) || 10; // default to 10 items per page if not provided

  const offset = (page - 1) * pageSize;

  const videoResult = await Video.findAndCountAll({
    where: {
      createdBy: req.user?.obj?.id,
      isDeleted: false
    },
    limit: pageSize,
    offset: offset,
  });

  if(!videoResult || videoResult.length == 0){
    return next(
      new ErrorHandler(
        "No data found",
        404
      )
    )
  }

  const totalPages = Math.ceil(videoResult.count / pageSize);

  return res.status(200).json({
    success: true,
    totalPages,
    currentPage: page,
    videoResult: videoResult.rows
  });
});

// get specific Video by Id
const getVideoById = asyncHandler(async (req, res, next) => {

  const {id} = req.params
  
  if(!id) {
    return next(
      new ErrorHandler(
        "Video_id is Missing" ,
         400
      )
    )
  }

  if(!IsValidUUID(id)){
    return next(new ErrorHandler("Must be a valid UUID", 400))
  }

  const videoData = await Video.findOne({
    where: { 
      video_id: id,
      createdBy: req.user?.obj?.id,
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

// update UploadMultiMedia Data
const updateVideoData = asyncHandler( async (req, res, next)=>{
  // take id and check video exist or not
  // take parameter frm user 
  // validate the field videoSelectedFile , videoData , title
  // update the data 
  // verify successfully updated or not
  // successfully updated send respond to user

  const { id } = req.params

  if(!id) {
    return next(new ErrorHandler("Video_id is Missing" , 400))
  }

  if(!IsValidUUID(id)){
    return next(new ErrorHandler("Must be a valid UUID", 400))
  }

  const video = await Video.findOne({
    where:{
      video_id: id,
      createdBy: req.user?.obj?.id
    }
  })

  if(!video || video.isDeleted){
    return next(
      new ErrorHandler(
        "Video not found",
         404
      )
    )
  }

  const data = JSON.parse(JSON.stringify(req.body))

  //let filterVideoFile = []

  // unlink all files from local
  // if (
  //   video &&
  //   video.videoFileUrl &&
  //   video?.videoFileUrl.length > 0 &&
  //   data?.videoFileUrl &&
  //   Array.isArray(data?.videoFileUrl) && 
  //   data?.videoFileUrl.length > 0
  // ) {
  //   filterVideoFile = video?.videoFileUrl.filter(
  //     (videoStr) => !data.videoFileUrl.includes(videoStr)
  //   );
  // }

  // if(filterVideoFile.length>0){
  //   filterVideoFile.forEach(videoPath => {
  //     fs.unlinkSync(`public/temp/${videoPath}`)
  //   })
  // }

  // if(filterVideoFile.length>0){
  //   const deleteFileOnAwsS3 = await deleteObjectsFromS3(filterVideoFile)

  //   if(!deleteFileOnAwsS3){
  //     return next(
  //       new ErrorHandler(
  //         "Something went wrong while updating video file from Aws s3 cloud",
  //         500
  //       )
  //     )
  //   }
  // }

  const [rowsUpdated, [updatedVideoData]] = await Video.update(
    data,
    {
      where:{
        video_id: id,
        createdBy: req.user?.obj?.id
      },
      returning: true
    }
  )

  if(rowsUpdated == 0){
    return next(
      new ErrorHandler(
        "Something went wrong while updating the videoData",
        500
      )
    )
  }

  return res.status(200).json({
    success: true,
    vidoData: updatedVideoData,
    message: "update the videoData successfully"
  })

})

// delete MultiMedia Data
const deleteVideoData = asyncHandler(async (req,res,next)=>{

  const { id } = req.params

  if (!id) {
    return next(
      new ErrorHandler(
        "Missing Video id", 
        400
      )
    );
  }

  if(!IsValidUUID(id)){
    return next(new ErrorHandler("Must be valid UUID" , 400))
  }

  const video = await Video.findOne({
    where: {
      video_id: id,
      createdBy: req.user?.obj?.id
    },
  });

  if (!video || video.isDeleted) {
    return next(
      new ErrorHandler(
        "VideoData not found", 
        404
      )
    );
  }

  // unlink all files from cloudinary
  // if(video && video.videoFileUrl && video?.videoFileUrl.length>0){
  //   const deleteFileOnAwsS3 = await deleteObjectsFromS3(video?.videoFileUrl)

  //   if(!deleteFileOnAwsS3){
  //     return next(
  //       new ErrorHandler(
  //         "Somwthing went wrong while deleting video file from aws s3 cloud"
  //       )
  //     )
  //   }
  // }

  const [deleteVideo] = await Video.update(
    {
      isDeleted: true
    },
    {
      where: {
        video_id: id,
        createdBy: req.user?.obj?.id
      }
    }
  );

  if (deleteVideo == 0) {
    return next(
      new ErrorHandler(
        "Something went wrong while deleting the video", 
        500
      )
    );
  }

  // unlink all files from local
  // if (
  //   video &&
  //   video.videoFileUrl &&
  //   Array.isArray(video?.videoFileUrl) &&
  //   video?.videoFileUrl?.length > 0
  // ) {
  //   video?.videoFileUrl.forEach((videoPath) => {
  //     fs.unlinkSync(`public/temp/${videoPath}`);
  //   });
  // }

  return res.status(200).json({
    success: true,
    message: "Video data deleted successufully",
  });
})

const updateVideoShared = asyncHandler( async(req , res, next)=>{

  const { isShared } = req.body
  const { id } = req.params

  if(!id) {
    return next(
      new ErrorHandler(
        "Video_id is Missing" ,
         400
      )
    )
  }

  if(!IsValidUUID(id)){
    return next(new ErrorHandler("Must be a valid UUID", 400))
  }

  const video = await Video.findOne({
    where:{
      video_id: id,
      createdBy: req.user?.obj?.id
    }
  })

  if(!video || video.isDeleted){
    return next(
      new ErrorHandler(
        "Video not found",
         404
      )
    )
  }

  if(!isShared || typeof(isShared) !== "boolean"){
    return next(
      new ErrorHandler(
        "shared Field is required and type is boolean"
      )
    )
  }

  await Video.update(
    {
      isShared: isShared
    },
    {
      where:{
        video_id: id,
        createdBy: req.user?.obj?.id
      }
    }
  )

  return res.status(200).json({
    success: true,
    message: "Data update successfully"
  })
})

const getAnalyticFeedbackData = asyncHandler(async(req,res,next)=>{

  const { videoId } = req.params 

  // Extract the video ID from the request parameters
  if(!videoId){
      return next(
          new ErrorHandler(
              "videoId is missing",
              400
          )
      )
  }

  if(!IsValidUUID(videoId)){
    return next(new ErrorHandler("Must be valid UUID", 400))
  }

  const data = await Analytic.findOne({
    where:{
      videoId: videoId,
      isDeleted: false
    },
    include: [{
      model: Video,
      as: "videoRes",
      where: {
        createdBy: req.user?.obj?.id,
        isDeleted:false
      },
      attributes:[]
    }]
  });
  
  
  if(!data){
      return next(
          new ErrorHandler(
              "No data found with videoId associated with admin",
              404
          )
      )
  }

  // Return the feedback as a response
  res.status(200).json({
      success: true,
      message: "Data send successfully",
      data,
  });
})

const summeryResponse = async (req, res, next) => {
  try {

    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Mising required field id", 400));
    }

    // if (!IsValidUUID(id)) {
    //   return next(new ErrorHandler("Must be a valid UUID", 400));
    // }

    const analyticResponse = await Analytic.findByPk(id,{
      include: [{
        model: Video,
        as:"videoRes",
        where: {
            createdBy: req.user?.obj?.id,
            isDeleted:false
        },
        attributes:[]
    }],
      attributes:{
        exclude: ["id","createdAt","updatedAt","videoId"]
      }
    })

    if(!analyticResponse){
      return next( new ErrorHandler("analytic not found", 404))
    }

    const jsonString = JSON.stringify(analyticResponse);

    const completion = await openAi.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Summarize the key insights, common themes, and important points from the following survey questions and answers related to a product demo. Focus on capturing the most relevant and frequently mentioned information across the responses, while omitting unnecessary details or redundancies.
          Analyze and include the overall sentiment (positive, negative, or neutral) expressed in the responses to each question. If the survey includes numerical data, ratings, or quantitative feedback, incorporate relevant statistics or averages in the summary.
          The goal is to provide a concise yet comprehensive overview of the survey data, highlighting both the qualitative feedback and quantitative evaluations. Present the summary in a structured format, using paragraphs or bullet points as appropriate. The length of the summary should be approximately 300-400 words. ${jsonString}`,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    return res.status(200).json({
      success: true,
      message: "Data send successfully",
      content: completion.choices[0].message.content
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong to genearting summary",
    });
  }
};

// const responseData = async(req , res , next)=>{
//   const request = require('request');

// const credentials = {
//     OS_PROJECT_DOMAIN_NAME: 'default',
//     OS_USER_DOMAIN_NAME: 'Default',
//     OS_PROJECT_NAME: 'bgjokrb8n4my',
//     OS_USERNAME: 'maheshm_6698_push_3987',
//     OS_PASSWORD: 'd306888862',
//     OS_AUTH_URL: 'https://controller.5centscdn.com/v3/'
//   };

// let authToken = "gAAAAABmb8YD58thNbhJdxmR-K0MNTkbKEsyfde0Wk9zYqr2DfbEeWeSfDvBfTfza8wE-Jrv8Cqgp2XPKFZu1yuMMCWwOES0SumZgIQp02sTUmQHBr6e5U9dHESFPWX07qDRlVK6KtTlx4sAG9EBSZo0J0zuOV1FPIWx_cFPYuPKD1YtaxPlIkg";
// let storageUrl = "http://controller.cdnized.com:8081/v1/AUTH_79b88a17bf5049c6b0d632cfe21ad880";

// const authPayload = {
//     auth: {
//       identity: {
//         methods: ['password'],
//         password: {
//           user: {
//             domain: { name: credentials.OS_USER_DOMAIN_NAME },
//             name: credentials.OS_USERNAME,
//             password: credentials.OS_PASSWORD
//           }
//         }
//       },
//       scope: {
//         project: {
//           domain: { name: credentials.OS_PROJECT_DOMAIN_NAME },
//           name: credentials.OS_PROJECT_NAME
//         }
//       }
//     }
//   };

//   const requestOptions = {
//     url: `${credentials.OS_AUTH_URL}/auth/tokens`,
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(authPayload)
//   };

// const generateToken = async () => {
//   try {
//     // Send the authentication request
//     const response = await new Promise((resolve, reject) => {
//       request(requestOptions, (error, response, body) => {
//         if (error) {
//           reject(error);
//         } else {
//             console.log(response)
//           resolve(response);
//         }
//       });
//     });

//     const responseData = JSON.parse(response.body)
//     console.log("response" , responseData)
//     authToken = response.headers['x-subject-token'];
//     storageUrl = responseData.token.catalog.find(service => service.type === 'object-store').endpoints[0].url;

//     console.log("authToken" , authToken)
//     console.log("storageUrl" , storageUrl)

//     return res.status(200).json({
//       success: true,
//       message: "Data send successfully",
//       data: responseData
//     })

//     // Update or create a new Credential instance
//     const [credential, created] = await Credential.findOrCreate({
//       where: {},
//       defaults: { token: authToken, storageUrl: storageUrl }
//     });

//     if (!created) {
//       credential.token = authToken;
//       credential.storageUrl = storageUrl;
//       await credential.save();
//     }

//     console.log('Auth Token:', authToken);
//     console.log('Storage URL:', storageUrl);
//     console.log(`Token and storage URL ${created ? 'created' : 'updated'} in database`);
//   } catch (error) {
//     console.error('Error:', error);
//   }
// };

// // Generate the initial token and store it in the database
// generateToken();

// // Regenerate the token and update it in the database every 23 hours (23 * 60 * 60 * 1000 milliseconds)
// setInterval(generateToken, 23 * 60 * 60 * 1000);
// }

// const deleteFileFromCDN = async (req,res,next) => {
//   try {

//     const fileUrl = "https://your-cdn-url.com/path/to/your/file"
//     const response = await axios.delete('https://api.5centscdn.com/v2/zones/vod/push/3987/delete', {
//       headers: {
//         accept: "application/json",
//         "X-API-Key": process.env.CDN_API_KEY,
//       },
//       data: {
//         url: fileUrl
//       }
//     });

//     if (response.status === 200) {
//       console.log('File deleted successfully');
//     } else {
//       console.log('Failed to delete file:', response.status, response.statusText);
//     }
//   } catch (error) {
//     console.error('Error deleting file:', error.message);
//   }
// };

module.exports = { 
  uploadVideo, 
  createVideoData , 
  getAllVideo, 
  getVideoById,
  updateVideoData,
  deleteVideoData,
  updateVideoShared,
  getAnalyticFeedbackData,
  uploadThumb,
  summeryResponse,
}
