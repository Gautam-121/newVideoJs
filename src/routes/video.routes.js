const express = require("express");
const router = express.Router();
const {
  getAllVideo,
  getVideoById,
  uploadVideo,
  createVideoData,
} = require("../controllers/video.controller.js");
const upload = require("../utils/videoUpload.js")
const {verifyJWt} = require("../middlewares/auth.middleware.js")


router.post("/upload/multipleMedia", verifyJWt ,  upload.any() , createVideoData);

router.get("/getAllVideo", verifyJWt ,  getAllVideo);

router.get("/getVideoById/:id", verifyJWt ,  getVideoById)

router.post("/upload/media", verifyJWt ,  upload.fields([{ name: "video" }]), uploadVideo);


module.exports = router;