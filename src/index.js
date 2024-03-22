const app = require("./app.js")
const {connectDB} = require("./db/index.js");

process.on("uncaughtException", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down the server due to uncaughtException Error `);
  process.exit(1);
});

//Database Connection
connectDB()
.then(() => {
    const server = app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })

    process.on("unhandledRejection" , (err)=>{
        console.log(`Error: ${err.message}`)
        console.log(`Shutting down the server due to Unhandled Promise Rejection`);
    
        server.close(()=>{
            process.exit(1)
        })
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})

