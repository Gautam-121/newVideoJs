const express = require("express");
const app = express();
const database = require("./config/database.js");
const dotenv = require("dotenv");
const uploadRoutes = require("./routes/uploadRoutes");
const queAnsRoutes = require("./routes/questionAnswerRoutes.js")
const cors = require("cors");
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(cors());


process.on("uncaughtException", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down the server due to uncaughtException Error `);
  process.exit(1);
});

database.sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/v1", uploadRoutes);
app.use("/api/v2", queAnsRoutes);

const server = app.listen(process.env.PORT ,() => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
