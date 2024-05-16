const express = require("express")
const {
  registerLogin,
  verifyOtp,
  storeFeedback,
  socialLogin,
  getFeedBack,
  getVideoByClient
} = require("../controllers/client.controller");
const {
  verifyClientToken
} = require("../middlewares/auth.middleware.js") 
const router = express.Router()

router.route("/auth").post(registerLogin)

router.route("/social/auth").post(socialLogin)

router.route("/verify-otp").post(verifyOtp)

router.route("/analytic/feedback/:videoId").post( verifyClientToken , storeFeedback)

router.route("/feedback/:videoId").get( verifyClientToken , getFeedBack )

router.get("/getVideoById/:customerId/:videoId" , verifyClientToken , getVideoByClient )




module.exports = router