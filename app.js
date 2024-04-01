require("dotenv").config();
const express = require("express");
const errorMiddleware = require("./middlewares/error.middleware.js");
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const cors = require("cors");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());

//Import Routes
const userRouter = require("./routes/user.routes.js")
const uploadRouter = require("./routes/video.routes.js");
const quetionRouter = require("./routes/questions.routes.js");

// Define your proxy middleware
const apiProxy = createProxyMiddleware('/api', {
    target: 'http://139.5.190.56:8081', // Your backend API endpoint
    changeOrigin: true, // Required for virtual hosted sites
    secure: false, // Allow proxying to HTTPS targets with invalid SSL certificates
    // Additional options as needed
  });
  

app.get("/",(req,res,next)=>{
    return res.status(200).json({
        success: true,
        message: "Deployed Successfully"
    })
})

app.use("/api/v1/video", uploadRouter);
app.use("/api/v1/question", quetionRouter);
app.use("/api/v1/users", userRouter)

app.use(errorMiddleware)

module.exports = app
