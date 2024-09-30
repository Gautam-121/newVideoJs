const express = require("express")
const router = express.Router()
const {verifyJWt} = require("../middlewares/auth.middleware.js")
const {
    createdBranding,
    getAppBranding,
    updateAppBrandingDetails,
    updateCoverImage,
    updateLogo,
} = require("../controllers/adminAppBranding.controller")
const {
   uploadAdminConfig,
   handleMulterError
} = require("../middlewares/multer.middleware.js")



router.route("/app-branding").post( 
    verifyJWt ,
    uploadAdminConfig.fields([
        {
            name: "logo",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount:1
        },
    ]),
    handleMulterError,
    createdBranding
) 

router.route("/app-branding").get( verifyJWt , getAppBranding) 

router.route("/details/app-branding").put( verifyJWt , updateAppBrandingDetails) 

router.route("/coverImage/app-branding").patch( 
    verifyJWt , 
    uploadAdminConfig.single("coverImage"),
    handleMulterError,
    updateCoverImage
)

router.route("/logo/app-branding").patch( 
    verifyJWt , 
    uploadAdminConfig.single("logo"),
    handleMulterError,
    updateLogo
) 


module.exports = router
