const express = require("express");
const router = express.Router();
const {
  getAllVideo,
  getVideoById,
  uploadVideo,
  createVideoData,
  deleteVideoData,
  updateVideoData,
  updateVideoShared
} = require("../controllers/video.controller.js");
const upload = require("../middlewares/multer.middleware.js")
const {verifyJWt} = require("../middlewares/auth.middleware.js")


router.post("/upload/multipleMedia", verifyJWt ,  upload.any() , createVideoData);

router.get("/getAllVideo", verifyJWt ,  getAllVideo);

router.get("/getVideoById/:id" ,   getVideoById)

router.post("/upload/media" ,  upload.fields([{ name: "video" }]), uploadVideo);

router.put("/updateVideo/:id", verifyJWt , upload.any() , updateVideoData )

router.delete("/deleteVideo/:id", verifyJWt , deleteVideoData )

router.put("/update/shared/:id", verifyJWt , updateVideoShared)



module.exports = router;