const express = require("express")
const {
  registerLogin,
  verifyOtp,
  storeFeedback,
  getAnalyticFeedbackData,
  socialLogin,
} = require("../controllers/client.controller");
const router = express.Router()

router.route("/auth").post(registerLogin)

router.route("/social/auth").post(socialLogin)

router.route("/verify-otp").post(verifyOtp)

router.route("/analytic/feedback").post(storeFeedback)

router.route("/analytic/feedback/:videoId").get(getAnalyticFeedbackData)



module.exports = router