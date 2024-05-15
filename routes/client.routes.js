const express = require("express")
const {
  registerLogin,
  verifyOtp,
  storeFeedback,
  getAnalyticFeedbackData,
  socialLogin,
} = require("../controllers/client.controller");
const {
  verifyJWt,
  verifyClientToken
} = require("../middlewares/auth.middleware.js") 
const router = express.Router()

router.route("/auth").post(registerLogin)

router.route("/social/auth").post(socialLogin)

router.route("/verify-otp").post(verifyOtp)

router.route("/analytic/feedback/:videoId").post( verifyClientToken , storeFeedback)

router.route("/analytic/feedback/:videoId").get( verifyJWt , getAnalyticFeedbackData)



module.exports = router