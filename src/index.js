const express = require("express");
const app = express();
const database = require("./config/database.js");
const dotenv = require("dotenv");
const uploadRoutes = require("./routes/uploadRoutes");
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

const server = app.listen(process.env.PORT, () => {
  console.log(`server is working on http://localhost:${process.env.PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
