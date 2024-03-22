const User = require("../models/user.models.js")
const jwt = require("jsonwebtoken")
const ErrorHandler = require("../utils/errorHandler.js")

const verifyJWt = async (req , res , next)=>{

    let token = req.headers["authorization"]

    if(!token){
        return next(
            new ErrorHandler("Please Login to access this resource",401)
        )
    }

    token = token.split(" ")[1]

    if(!token || token == "null"){
        return next(
            new ErrorHandler("Please Login to access this resource",401)
        )
    }

    jwt.verify(token , process.env.JWT_SECRET , async (err , decodedToken)=>{
        if(err){
            let msg = err.message = "jwt expiry" ? "token is expired , please login again" : "Invalid Token"
            return next(
                new ErrorHandler(msg,401)
            )
        }
        req.user = await User.findByPk(decodedToken.id)
        next()
    })
}

module.exports = {verifyJWt}