class ErrorHandler extends Error{
    constructor(message , statusCode, name){
        super(message)
        this.statusCode = statusCode
        this.name = name

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = ErrorHandler