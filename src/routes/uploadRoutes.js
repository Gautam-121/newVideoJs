const express = require("express");
const router = express.Router();
const {getAllVideo , uploadMediaData , getVideoById , updateVideoById} = require("../controller/uploadControllers.js");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: "./uploads",
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

router.post("/upload/media", upload.fields([{ name: "vtt" }]) , uploadMediaData);
router.get("/getAllVideo", getAllVideo);
router.get("/getVideoById/:id", getVideoById)
// router.put("/updateVideoById/:id" , upload.fields([{ name: "video" }, { name: "vtt" }]) ,  updateVideoById)

module.exports = router;