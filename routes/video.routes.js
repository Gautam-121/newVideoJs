const express = require("express");
const router = express.Router();
const {
  uploadVideo,
  uploadThumb,
  getAllVideo,
  getVideoById,
  createVideoData,
  deleteVideoData,
  updateVideoData,
  updateVideoShared,
  getAnalyticFeedbackData,
  summeryResponse,
} = require("../controllers/video.controller.js");
const { uploadThumbnail , uploadVideos , uploadVideMiddleware , handleThumbnailMiddleware } = require("../middlewares/multer.middleware.js")
const {verifyJWt} = require("../middlewares/auth.middleware.js")
const validation = require("../validations/video.validation.js")


router.post("/upload/media" , verifyJWt ,  uploadVideos.single("video"), uploadVideMiddleware , uploadVideo);// checked

router.post("/upload/thumbnail" , verifyJWt , uploadThumbnail.single("thumbnail") , handleThumbnailMiddleware ,  uploadThumb) // checked

router.post("/upload/multipleMedia", verifyJWt ,  uploadVideos.any() , createVideoData);

router.get("/getAllVideo", verifyJWt ,  getAllVideo); // checked

router.get("/getVideoById/:id" , verifyJWt ,  getVideoById) // VideoId  // checked

router.put("/updateVideo/:id", verifyJWt , uploadVideos.any() , updateVideoData ) // VideoId

router.delete("/deleteVideo/:id", verifyJWt , deleteVideoData ) // VideoId // checked

router.put("/update/shared/:id", verifyJWt , updateVideoShared) // VideoId // checked

router.route("/analytic/feedback/:id").get( verifyJWt , getAnalyticFeedbackData) // VideoId // checked

router.route("/analytic/feedback/summary/:id").get( verifyJWt , summeryResponse ) // analyticId // checked





module.exports = router;