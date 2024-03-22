const Video = require("../models/video.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");


// CREATING UPLOADMEDIA DATA
const createVideoData = asyncHandler(async (req, res, next) => {

  const data = JSON.parse(JSON.stringify(req.body));

  if(Object.keys(data).length == 0){
    return next(
      new ErrorHandler("All field are required",400)
    )
  }

  const videoData = await Video.create({
    video_id: data.id,
    title: data.title,
    videoSelectedFile: data.selectedVideo,
    createdById: req.user.id
  });

  return res.status(201).json({
    success: true,
    message: "Video Data Created Successfully",
    videoData,
  });
})

// Upload video file
const uploadVideo = asyncHandler(async(req , res , next)=>{

  const videoFilePath = req?.files["video"]?.[0]?.filename;

  if(!videoFilePath){
    return next(
      new ErrorHandler("Missing Video File , Provide video file",400)
    )
  }

  return res.status(201).json({
    success:true,
    message:"Video Uploaded Successfully",
    videoUrl: videoFilePath
  })
})

// get all created Video Data 
const getAllVideo = asyncHandler(async (req, res, next) => {

  const videoResult = await Video.findAll(
    {
      where:{
        createdById: req.user.id
      }
    }
  );
  return res.status(200).json({
    success: true,
    videoResult
  })
})


// get specific Video by Id
const getVideoById = asyncHandler(async (req, res, next) => {
  
  if (!req.params.id) {
    return next(
      new ErrorHandler("Video_id is Missing" , 400)
    )
  }

  const videoData = await Video.findOne({
    where: { 
      video_id: req.params.id,
      createdById: req.user.id
    }
  })
  
  if (!videoData) {
    return next(
      new ErrorHandler("Video data not Found",404)
    )
  }
  return res.status(200).json({
    success: true,
    data: videoData
  })
})



module.exports = { 
  uploadVideo, 
  createVideoData , 
  getAllVideo, 
  getVideoById 
}
