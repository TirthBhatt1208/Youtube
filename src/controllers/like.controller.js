import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userid = req.user?._id;
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400 , "Invalid video id");
    }

    const isLikedAlready = await Like.findOne({
        video: videoId,
        likedBy: userid
    })

    if (isLikedAlready) {
        
        await Like.findOneAndDelete({
            video: videoId,
            likedBy: userid
        })

        res
        .status(200)
        .json(new ApiResponse(200 , {isLiked: false}));
    }

    await Like.create({
        video: videoId,
        likedBy: userid
    })

    return res
    .status(200)
    .json(new ApiResponse(200 , {isLiked: true}));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userid = req.user?._id;
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const isLikedAlready = await Like.findOne({
        comment: commentId,
        likedBy: userid
    })

    if (isLikedAlready) {

        await Like.findOneAndDelete({
            comment: commentId,
            likedBy: userid
        })

        res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        comment: commentId,
        likedBy: userid
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userid = req.user?._id;
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const isLikedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: userid
    })

    if (isLikedAlready) {

        await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy: userid
        })

        res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        tweet: tweetId,
        likedBy: userid
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    if(!isValidObjectId(userId)) {
        throw new ApiError(400 , "Invalid userid");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            },
        }
    ])

    if (!likedVideos) {
        throw new ApiError(500 , "Problem occure while get liked videos!");
    }

    console.log("liked videos: " , likedVideos);
    
    return res
    .status(200)
    .json(new ApiResponse(200 , likedVideos , "liked videos fethced successfully!!"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}