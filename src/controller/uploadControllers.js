const VideoModel = require("../model/videoSchema");

// CREATING UPLOADMEDIA DATA
const createVideoData = async (req, res) => {
  try {

    const data = req.body

    if(Object.keys(data).length == 0){
      return res.status(400).json({
        success: false,
        message: "video data missing"
      })
    }

    const videoData = await VideoModel.create({
      video_id: data.id,
      title: data.title,
      videoSelectedFile:data.selectedVideo
    });

    return res.status(201).json({
      success: true,
      message: "Video Data Created Successfully",
      videoData,
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    })
  }
}

// CREATING UPLOADMEDIA DATA
// const uploadMediaDatas = async (req, res) => {
//   try {
// Creating Video data
// const createVideoData = async (req, res) => {
//   try {

//     console.log("Enter")
//     const videoFilePath = JSON.parse(JSON.stringify(req.files))
//     const data = JSON.parse(JSON.stringify(req.body))

//     console.log("data" , data)
//     console.log("videoFilePath" , videoFilePath)
//     console.log("video", data.video)
//     console.log("videoSelected", JSON.parse(data.selectedVideo))
//     console.log("videoSelected Id" , data.id)

//     return res.status(200).json({
//       status: true,
//       message: "data Come sussfully",
//       data:data.selectedVideo
//     })
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: error.message,
//     })
//   }
// }

// Upload video file
const uploadVideo = async(req , res , next)=>{

  const videoFilePath = req?.files["video"]?.[0]?.filename;

  if(!videoFilePath){
    return res.status(400).json({
      success: false,
      message: "Missing Video File"
    })
  }

  return res.status(201).json({
    success:true,
    message:"Video Uploaded Successfully",
    videoUrl: videoFilePath
  })
}

// get all created Video Data 
const getAllVideo = async (req, res) => {
  try {

    const videoResult = await VideoModel.findAll();
    return res.status(200).json({
      success: true,
      videoResult
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error
    });
  }
}

// get specific Video by Id
const getVideoById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Video_id is Missing"
      })
    }

    const videoData = await VideoModel.findOne({
      where: { video_id: req.params.id }
    })
    
    if (!videoData) {
      return res.status(404).json({
        success: false,
        message: "Video data not Found"
      })
    }
    return res.status(200).json({
      success: true,
      data: videoData
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}



module.exports = { uploadVideo, createVideoData , getAllVideo, getVideoById }
