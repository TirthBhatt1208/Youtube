import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path: "./.env"});





connectDB()
.then( () => {
    app.listen( process.env.PORT || 8000 , () => {
        console.log(`App is Listening on port: ${process.env.PORT}`);
    })

    // server.on("connection", (connection) => {
    //     console.log("Connetion: ", connection)});
    
})
.catch( (error) => {
    console.log("MongoDB Connection FAILED!!! " , error);
})







// we will connect DB also by IIFI Here
// many perosns create app here also

/*
import express from "express";

const app = express();
( async () => {
    
    try {
        const connect = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        app.on("Error" , (error) => {
            console.log("Error: " , error);
            throw error;
        })

        app.listen(process.env.PORT , () => {
            console.log(`App is Listening on port ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error(`Error: ${error}`);
        throw error;
    }
}) ()
*/