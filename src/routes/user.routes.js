const express = require("express")
const router = express.Router()
const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    verifyOtp
} = require("../controllers/user.controller.js")

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

router.route("/password/forgot").post(forgotPassword)

router.route("/verifyotp").post(verifyOtp)

router.route("/password/reset").put(resetPassword)


module.exports = router