import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if(!content) {
        throw new ApiError(400 , "Tweet contnet not available!");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if (!tweet) {
        throw new ApiError(500 , "Problem occure while creating tweet!");
    }

    res.
    status(200)
    .json(new ApiResponse(200 , tweet , "Tweet created successfully!"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userid} = req.params;

    if (!isValidObjectId(userid)) {
        throw new ApiError(404, "userid not valid");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userid)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner_details",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            "avatar.url": 1
                        }
                    },
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likesDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likesDetails"
                },
                ownerDetails: {
                    $first: "$owner_details"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likesDetails.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdat: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ])

    if (!tweets) {
        throw new ApiError(500 , "Can not factched tweets!");
    }

    res
    .status(200)
    .json(new ApiResponse(200 , tweets , "Tweets get succesfully!"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {content} = req.body;
    const {tweetId} = req.params;

    if (!content) {
        throw new ApiError(404 , "new tweet is required!!");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const userTweet = await Tweet.findById(tweetId)
    if (userTweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit thier tweet");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {content}
        },
        {
            new: true
        }
    )

    console.log("New tweet: " , newTweet);
    
    if (!newTweet) {
        throw new ApiError(500 , "Problem occured while updating tweet!!");
    }

    res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet updated successfully!"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400 , "Invalid tweet id!!");
    }
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404 , "Tweet not found!!!");
    }
    if (tweet?.owner.toString() != req.user?._id) {
        throw new ApiError(400 , "Only owner can delete tweet!!!");
    }

    await Tweet.findByIdAndDelete(tweetId);

    res
    .status(200)
        .json(new ApiResponse(200, {}, "Tweet Deleted successfully!!!"));


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}