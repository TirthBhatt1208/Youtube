import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user?._id;
    console.log("user id :: " , userId);
    
    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: "subscribersCount"
        }
    ])

    const video =  await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                totalLikes: {
                    $size: "$likes" // this likes are per videos
                },
                totalViews: "$views", // this views are per videos
                totalVideos: 1
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: "$totalLikes"
                },
                totalViews: {
                    $sum: "$totalViews"
                },
                totalVideos: {
                    $sum: 1
                }

            }
        }
    ])

    // console.log("videos :: " , video[0]);
    
    const channelStats = {
        totalSubscribers: totalSubscribers[0]?.subscriberCount || 0,
        totalVideos: video[0]?.totalVideos || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalViews: video[0]?.totalViews || 0
    }

    return res
            .status(200)
            .json(new ApiResponse(200 , channelStats , "channel stats fetched successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user?._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $addFields: {
                createdAt: {
                    $dateToParts: { date: "$createdAt" }
                },
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                createdAt: {
                    year: 1,
                    month: 1,
                    day: 1
                },
                isPublished: 1,
                likesCount: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "channel stats fetched successfully"
            )
        );
})

export {
    getChannelStats,
    getChannelVideos
}