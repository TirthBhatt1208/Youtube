import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "200mb"})) // if any data comes from filing form
app.use(express.urlencoded({limit: "200mb" , extended: true})) // data comes from url also
app.use(express.static("public")) // store data in public folder
app.use(cookieParser()) // to get and set data of user in browser

// app.use((req, res, next) => {
    
//     console.log("request :: " , req);
//     // console.log("responce: ", res);
//     // console.log("next: ", next);
    
//     console.log("Headers:", req.headers['content-type']);
//     next();
// });


//import router
import userRouter from "./routes/user.route.js"
import tweetRouter from './routes/tweet.route.js'
import likeRouter from './routes/like.route.js'
import subscriptionRouter from "./routes/subscription.route.js"
import commentRouter from "./routes/comment.route.js"
import playlistRouter from './routes/playlist.route.js'
import videoRouter from "./routes/video.route.js"
import healthCheckRouter from "./routes/healthCheck.route.js"
import dashboardRouter from "./routes/dashboard.route.js"

app.use("/api/v1/users" , userRouter);
app.use("/api/v1/tweets" , tweetRouter);
app.use("/api/v1/likes" , likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlists" , playlistRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/health", healthCheckRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };