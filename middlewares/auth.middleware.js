const jwt = require("jsonwebtoken")
const ErrorHandler = require("../utils/errorHandler.js")
const Client = require("../models/client.models.js")

const verifyJWt = async (req, res, next) => {
  try {

    let token = req.headers['authorization'];

    if (!token) {
      return next(new ErrorHandler('Please Login to access this resource', 401));
    }

    // Assuming the token is in the format "Bearer <token>"
    const parts = token.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Token format is incorrect' });
    }

    const authToken = parts[1];

    // Verify the token
    jwt.verify(authToken, process.env.JWT_ADMIN_SECRET, (err, decodedToken) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new ErrorHandler('Token has expired, please login again', 401));
        } else if (err.name === 'JsonWebTokenError') {
          return next(new ErrorHandler('Invalid token, please login again', 401));
        } else {
          return next(new ErrorHandler('Failed to authenticate token', 401));
        }
      }

      // Token is valid, attach the decoded token to the request object
      req.user = decodedToken?.obj;
      req.token = authToken
      next();
    });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler('Internal Server Error', 500));
  }
};

const verifyClientToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
      return next(new ErrorHandler("Please Login to access this resource", 401));
    }

    const parts = authorizationHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next(new ErrorHandler("Token format is incorrect", 401));
    }

    const authToken = parts[1];

    jwt.verify(authToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new ErrorHandler('Token has expired, please login again', 401));
        } else if (err.name === 'JsonWebTokenError') {
          return next(new ErrorHandler('Invalid token, please login again', 401));
        } else {
          return next(new ErrorHandler('Failed to authenticate token', 401));
        }
      }

      try {
        const user = await Client.findByPk(decodedToken.id);
        if (!user) {
          return next(new ErrorHandler("User not found", 401));
        }

        req.user = user;
        next();
      } catch (error) {
        console.error("Error fetching user:", error);
        return next(new ErrorHandler("Failed to verify user", 500));
      }
    });
  } catch (error) {
    console.error("Error in token verification:", error);
    return next(new ErrorHandler('Internal Server Error', 500));
  }
};

module.exports = { verifyJWt, verifyClientToken }