const  {Sequelize} =  require("sequelize") 
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize({
  dialect: process.env.Dialect,
  host: process.env.Host,
  username: process.env.User,
  password:  process.env.Password,
  database: process.env.Database
});

module.exports = sequelize


// const uploadMediaData = async (req, res) => {
//     try {

//         const videoFilePath = req?.files["video"]?.[0]?.filename;
//         let vttFilePath = null;
//         const data = JSON.parse(JSON.stringify(req.body))

//         if(req.files?.["vtt"]?.[0]?.filename){
//             vttFilePath = req.files["vtt"][0].filename
//         }

//         const mediaResult = await VideoModel.create({
//             video_path: data.videoFilePath,
//             vtt_path: vttFilePath,
//             video_id : data.id,
//             title: data.title
//         });

//         return res.status(201).json({
//             success: true,
//             message: "Video Data Created Successfully",
//             mediaResult,
//         });
//     } catch (error) {
//         res.status(500).send({
//             success: false,
//             message: error.message,
//         });
//     }
// }




