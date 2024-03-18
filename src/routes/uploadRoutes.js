const express = require("express");
const router = express.Router();
const { getAllVideo, getVideoById  } = require("../controller/uploadControllers.js");

router.get("/getAllVideo", getAllVideo);

router.get("/getVideoById/:id", getVideoById)

module.exports = router;