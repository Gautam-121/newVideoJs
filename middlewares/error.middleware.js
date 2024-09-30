const errorMiddleware = (err,req,res,next)=>{

    err.message = err.message || "Internal Server Error"
    err.statusCode = err.statusCode || 500

    if(err.name === "SequelizeValidationError"){
        err.statusCode = 400
    }

    res.status(err.statusCode).json({
        success: false,
        error: err.message
    })
}

module.exports = errorMiddleware