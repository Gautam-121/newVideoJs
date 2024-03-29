const Video = require("../models/video.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const fs = require("fs")


// CREATING UPLOADMEDIA DATA
const createVideoData = asyncHandler(async (req, res, next) => {

  const data = JSON.parse(JSON.stringify(req.body));

  if(!data.video_id || !data.title || !data.videoSelectedFile){
    return next(
      new ErrorHandler("All field are required",400)
    )
  }

  const isVideoIdExist = await Video.findByPk(data.video_id)

  if(isVideoIdExist){
    return next(
      new ErrorHandler("Video_id already exist", 409)
    )
  }

  const video = await Video.create({
    ...data,
    createdById: req.user.id
  });

  const videoData = await Video.findByPk(video.video_id)

  if(!videoData){
    return next(
      new ErrorHandler("Something went wrong while creating the data", 500)
    )
  }

  return res.status(201).json({
    success: true,
    message: "Video Data Created Successfully",
    videoData,
  });
})

// Upload video file
const uploadVideo = asyncHandler(async(req , res , next)=>{

  const videoFilePath = req?.files?.["video"]?.[0]?.path;

  fs.unlinkSync(videoFilePath)

  console.log(req?.files?.["video"]?.[0])

  return res.status(200).json({
    success: true
  })

  if(!videoFilePath){
    return next(
      new ErrorHandler("Missing Video File , Provide video file", 400)
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

  const {id} = req.params
  
  if(!id) {
    return next(
      new ErrorHandler("Video_id is Missing" , 400)
    )
  }

  const videoData = await Video.findOne({
    where: { 
      video_id: id,
    }
  })
  
  if (!videoData) {
    return next(
      new ErrorHandler("Video data not Found",404)
    )
  }
  return res.status(200).json({
    success: true,
    message: "Data Send Successfully",
    data: videoData
  })
})

// update UploadMultiMedia Data
// const updateVideoData = asyncHandler( async (req, res, next)=>{
//   // take id and check video exist or not
//   // take parameter frm user 
//   // validate the field videoSelectedFile , videoData , title
//   // update the data 
//   // verify successfully updated or not
//   // successfully updated send respond to user

//   const video = await Video.findByPk(req.params.id)

//   if(!video){
//     return next(
//       new ErrorHandler("Video not found", 400)
//     )
//   }

//   const data = JSON.parse(JSON.stringify(req.body))

//   const videoUpdate = await Video.update()

// })



module.exports = { 
  uploadVideo, 
  createVideoData , 
  getAllVideo, 
  getVideoById 
}
