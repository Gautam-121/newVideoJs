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
const { uploadThumbnail , uploadVideos } = require("../middlewares/multer.middleware.js")
const {verifyJWt} = require("../middlewares/auth.middleware.js")

router.post("/upload/media" , verifyJWt ,  uploadVideos.single("video"), uploadVideo);

router.post("/upload/thumbnail" , verifyJWt , uploadThumbnail.single("thumbnail") , uploadThumb)

router.post("/upload/multipleMedia", verifyJWt ,  uploadVideos.any() , createVideoData);

router.get("/getAllVideo", verifyJWt ,  getAllVideo);

router.get("/getVideoById/:id" , verifyJWt ,  getVideoById)

router.put("/updateVideo/:id", verifyJWt , uploadVideos.any() , updateVideoData )

router.delete("/deleteVideo/:id", verifyJWt , deleteVideoData )

router.put("/update/shared/:id", verifyJWt , updateVideoShared)

router.route("/analytic/feedback/:videoId").get( verifyJWt , getAnalyticFeedbackData)

router.route("/analytic/feedback/summary/:id").get( verifyJWt , summeryResponse )





module.exports = router;