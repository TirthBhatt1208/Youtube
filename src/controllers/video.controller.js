import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Like } from '../models/like.model.js'
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    console.log("query :: " , req.query);
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const pipeline = []

    if (query) {
        pipeline.push(
            {
                $search: {
                    index: "search-index",
                    text: {
                        query: query,
                        path: ["title" , "description"]
                    }
                }
            }
        )
    }

    if (userId) {

        if (!isValidObjectId) {
            throw new ApiError(400 , "invalid userid!!!");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({$match: {isPublised: true}})

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    console.log("title :: " , title);
    console.log("description :: " , description);
    
    
    // TODO: get video, upload to cloudinary, create video

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    console.log("req file :: " , req.files);
    
    const videoFilelocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    
    console.log("video path :: " , videoFilelocalPath);
    console.log("thumbnail path :: " , thumbnailLocalPath);
    
    

    if (!videoFilelocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail both are required!!!");
    }

    const videoFile = await uploadOnCloudinary(videoFilelocalPath , "video");
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
    
    if (!videoFile || !thumbnailFile) {
        throw new ApiError(400 , "Video file and thumbnail file not found!");
    }

    const video = await Video.create({
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnailFile.url,
            public_id: thumbnailFile.public_id
        },
        title,
        description,
        duration: videoFile.duration,
        isPublised: false,
        owner: req.user?._id
    });

    if (!video) {
        throw new ApiError(500 , "Error occured while publising video!");
    }

    return res
            .status(200)
            .json(new ApiResponse(200 , video , "Video publised successfully!!"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400 , "Invalid Video ID!!!");
    }
    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400 , "Invalid user ID!!!");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [req.user?._id, "$subscribers.subscriber"]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id , "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])

    if (!video) {
        throw new ApiError(404 , "Video not found!!");
    }

    //if video found increement video views
    await Video.findByIdAndUpdate(videoId , {
        $inc: {
            views: 1
        }
    });

    //add video to user's watch history
    await User.findByIdAndUpdate(req.user?._id , {
        $addToSet: {
            watchHistory: videoId
        }
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title , description} = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400 , "invalid video ID!!!");
    }
    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400 , 'Invalid user id!!!');
    }

    if(!(title && description)) {
        throw new ApiError("title and description is required!!!");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404 , "video not found!!!");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "you are not the owner!!");
    }
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400 , "thumbnail file is meassing")
    }

    const thumbnailFileDeletePath = video.thumbnail.public_id;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400 , "thumbnail not found!!!");
    }

    const updatedVideo = await Video.findOneAndUpdate(
        {_id: videoId }, 
        {
            $set: {
                title: title,
                description: description,
                thumbnail: {
                    url: thumbnail.url,
                    public_id: thumbnail.public_id
                }
            }
        },
        {
            new: true
        }
    )

    if (!updateVideo) {
        throw new ApiError(500 , "Error occured while updating video");
    }

    await deleteOnCloudinary(thumbnailFileDeletePath);

    return res
            .status(200)
            .json(new ApiResponse(200 , updatedVideo , "video update successfully!!!"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400 , "invalid video id!!!");
    }
    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400 , "invalid user id!!!");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "you are not the owner of this video")
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id)

    if (!videoDeleted) {
        throw new ApiError(400, "Failed to delete the video please try again");
    }

    await deleteOnCloudinary(video.videoFile.public_id);
    await deleteOnCloudinary(video.thumbnail.public_id);

    await Like.deleteMany({
        video: videoId
    })

    await Comment.deleteMany({
        video: videoId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't toogle publish status as you are not the owner"
        );
    }

    //console.log("video published" , video.isPublised);
    
    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublised: !video?.isPublised
            }
        },
        { new: true }
    );
    //console.log("toggle publish :: ", toggledVideoPublish);
    
    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: toggledVideoPublish.isPublised },
                "Video publish toggled successfully"
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}