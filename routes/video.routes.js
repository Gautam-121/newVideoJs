const express = require("express");
const router = express.Router();
const {
  getAllVideo,
  getVideoById,
  uploadVideo,
  createVideoData,
} = require("../controllers/video.controller.js");
const upload = require("../middlewares/multer.middleware.js")
const {verifyJWt} = require("../middlewares/auth.middleware.js")


router.post("/upload/multipleMedia", verifyJWt ,  upload.any() , createVideoData);

router.get("/getAllVideo", verifyJWt ,  getAllVideo);

router.get("/getVideoById/:adminId/:id" ,  getVideoById)

router.post("/upload/media", verifyJWt ,  upload.fields([{ name: "video" }]), uploadVideo);


module.exports = router;