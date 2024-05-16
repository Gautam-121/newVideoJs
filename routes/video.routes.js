const express = require("express");
const router = express.Router();
const {
  getAllVideo,
  getVideoById,
  uploadVideo,
  createVideoData,
  deleteVideoData,
  updateVideoData,
  updateVideoShared,
  getAnalyticFeedbackData
} = require("../controllers/video.controller.js");
const upload = require("../middlewares/multer.middleware.js")
const {verifyJWt, verifyClientToken} = require("../middlewares/auth.middleware.js")


router.post("/upload/multipleMedia", verifyJWt ,  upload.any() , createVideoData);

router.get("/getAllVideo", verifyJWt ,  getAllVideo);

router.get("/getVideoById/:id" , verifyJWt ,  getVideoById)

router.post("/upload/media" , verifyJWt ,  upload.fields([{ name: "video" }]), uploadVideo);

router.put("/updateVideo/:id", verifyJWt , upload.any() , updateVideoData )

router.delete("/deleteVideo/:id", verifyJWt , deleteVideoData )

router.put("/update/shared/:id", verifyJWt , updateVideoShared)

router.route("/analytic/feedback/:videoId").get( verifyJWt , getAnalyticFeedbackData)




module.exports = router;