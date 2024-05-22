require("dotenv").config();
const express = require("express");
const errorMiddleware = require("./middlewares/error.middleware.js");
const app = express();
const cors = require("cors");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/temp"));
app.use(cors());

//Import Routes
const userRouter = require("./routes/user.routes.js")
const uploadRouter = require("./routes/video.routes.js");
const quetionRouter = require("./routes/questions.routes.js");
const clientRouter = require("./routes/client.routes.js")

  
app.get("/",(req,res,next)=>{
    return res.status(200).json({
        success: true,
        message: "Deployed Successfully"
    })
})

app.use("/api/v1/video", uploadRouter);
app.use("/api/v1/question", quetionRouter);
app.use("/api/v1/users", userRouter)
app.use("/api/v1/client", clientRouter)

app.use(errorMiddleware)

module.exports = app


