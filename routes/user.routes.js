const express = require("express")
const router = express.Router()
const {verifyJWt} = require("../middlewares/auth.middleware.js")
const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    verifyOtp,
    changePassword
} = require("../controllers/user.controller.js")

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

router.route("/password/forgot").post(forgotPassword)

router.route("/verifyotp").post(verifyOtp)

router.route("/password/reset").put(resetPassword)

router.route("/password/update").put(verifyJWt ,  changePassword)


module.exports = router