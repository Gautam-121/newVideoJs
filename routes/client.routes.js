const express = require("express")
const {
  registerLogin,
  verifyOtp,
  storeFeedback,
  socialLogin,
  getFeedBack,
  getVideoByClient,
  getAppBrandingByClient,
  facebookDataDeletion,
  deletionData
} = require("../controllers/client.controller");
const {
  verifyClientToken
} = require("../middlewares/auth.middleware.js"); 
const router = express.Router()

router.route("/auth").post(registerLogin) // checked

router.route("/social/auth").post(socialLogin) // checked

router.route("/verify-otp").post(verifyOtp) // checked

router.route("/analytic/feedback/:videoId").post( verifyClientToken , storeFeedback) 

router.route("/feedback/:videoId").get( verifyClientToken , getFeedBack ) // checked

router.get("/getVideoById/:id" , verifyClientToken , getVideoByClient ) // checked  -- logicalIssue

router.route("/app-branding").get( getAppBrandingByClient ) // checked

router.route("/facebook/deletion").post( facebookDataDeletion ) // deleted Api

router.route("/facebook/deletion/page").get( deletionData ) // deleted Api



module.exports = router