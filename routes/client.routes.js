const express = require("express")
const {
  registerLogin,
  verifyOtp,
  storeFeedback,
  getFeedback,
} = require("../controllers/client.controller");
const router = express.Router()

router.route("/auth").post(registerLogin)

router.route("/verify-otp").post(verifyOtp)

router.route("/feedback").post(storeFeedback)

router.route("/feedback/:videoId").get(getFeedback)



module.exports = router