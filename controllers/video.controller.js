const Video = require("../models/video.models");
const asyncHandler = require("../utils/asyncHandler");
const ErrorHandler = require("../utils/errorHandler");
const fs = require("fs")
const {deleteObjectsFromS3,uploadFileToS3} = require("../utils/aws.js")


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
const uploadVideo = asyncHandler(async(req , res , next)=>{

  const videoFilePath = req?.files?.["video"]?.[0]?.filename;

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

  if(!videoFilePath){
    return next(
      new ErrorHandler(
        "Missing Video File , Provide video file",
         400
      )
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

  const video = await Video.findOne({
    where:{
      video_id: req.params.id,
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

  let filterVideoFile = []

  // unlink all files from local
  if (
    video &&
    video.videoFileUrl &&
    video?.videoFileUrl.length > 0 &&
    data?.videoFileUrl &&
    Array.isArray(data?.videoFileUrl) && 
    data?.videoFileUrl.length > 0
  ) {
    filterVideoFile = video?.videoFileUrl.filter(
      (videoStr) => !data.videoFileUrl.includes(videoStr)
    );
  }

  if(filterVideoFile.length>0){
    filterVideoFile.forEach(videoPath => {
      fs.unlinkSync(`public/temp/${videoPath}`)
    })
  }

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
        video_id: req.params.id,
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

  if (!req.params.id) {
    return next(
      new ErrorHandler(
        "Missing Video id", 
        400
      )
    );
  }

  const video = await Video.findOne({
    where: {
      video_id: req.params.id,
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

  const deleteVideo = await Video.destroy({
    where: {
      video_id: req.params.id,
      createdBy: req.user?.obj?.id
    },
  });

  if (!deleteVideo) {
    return next(
      new ErrorHandler(
        "Something went wrong while deleting the video", 
        500
      )
    );
  }

  // unlink all files from local
  if (
    video &&
    video.videoFileUrl &&
    Array.isArray(video?.videoFileUrl) &&
    video?.videoFileUrl?.length > 0
  ) {
    video?.videoFileUrl.forEach((videoPath) => {
      fs.unlinkSync(`public/temp/${videoPath}`);
    });
  }

  return res.status(200).json({
    success: true,
    message: "Video data deleted successufully",
  });
})

const updateVideoShared = asyncHandler( async(req , res, next)=>{

  const { isShared } = req.body

  const video = await Video.findOne({
    where:{
      video_id: req.params.id,
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
        video_id: req.params.id,
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
      },
  });

  const video = await Video.findOne({
      where: { 
          video_id: req.params.videoId,
          createdBy: req.user?.obj?.id
        }
  })
  
  if(!data || !video){
      return next(
          new ErrorHandler(
              "No data found with videoId associated with admin",
              404
          )
      )
  }

  data.videoId = video

  // Return the feedback as a response
  res.status(200).json({
      success: true,
      message: "Data send successfully",
      data,
  });
})


module.exports = { 
  uploadVideo, 
  createVideoData , 
  getAllVideo, 
  getVideoById,
  updateVideoData,
  deleteVideoData,
  updateVideoShared,
  getVideoByClient,
  getAnalyticFeedbackData
}
