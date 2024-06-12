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
  LOCAL_VIDEO_STORAGE_BASE_URL
 } = require("../constants.js")

const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// CREATING UPLOADMEDIA DATA
const createVideoData = asyncHandler(async (req, res, next) => {

  const data = JSON.parse(JSON.stringify(req.body));

  if(!data.title || !data.videoSelectedFile || !data.videoData || !data.videoFileUrl){
    return next(
      new ErrorHandler(
        "All field are required",
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

// Upload video file
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

    // Construct the video URL from the CDN response
    const videoUrl = `${HSL_BASE_URL}/${UPLOAD_VIDEO_FOLDER}/${uploadVideoFileOn5centCdn.data.filename}/playlist.m3u8`;

    // Safely delete the file from local storage after uploading to the CDN
    console.log(videoFilePath)
    try {
      if (fs.existsSync(videoFilePath.path)) {
        fs.unlinkSync(videoFilePath.path);
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
    // Handle errors and attempt to delete the local file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
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
      createdBy: req.user?.obj?.id
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
      createdBy: req.user?.obj?.id
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

  if(!video){
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

  if (!video) {
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

  if(!video){
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
      videoId: videoId
    },
    include: [{
      model: Video,
      as: "videoRes",
      where: {
        createdBy: req.user?.obj?.id
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
            createdBy: req.user?.obj?.id
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
  summeryResponse
}
