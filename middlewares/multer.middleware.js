const multer = require("multer");
const path = require("path")

// Storage configuration for videos
const videoStorage  = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null , "./public/temp/video")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
});

// Storage configuration for thumbnails
const thumbnailStorage  = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null , "./public/temp/thumbnails")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
});

const adminConfigStorage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null , "./public/temp/admin")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
})

// Multer upload instances for videos and thumbnails
const uploadVideos = multer({ storage: videoStorage })
const uploadThumbnail = multer({ storage: thumbnailStorage })
const uploadAdminConfig = multer({ storage: adminConfigStorage })



module.exports = { uploadVideos, uploadThumbnail , uploadAdminConfig };
