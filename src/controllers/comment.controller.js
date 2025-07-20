import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404 , "Video not found!!!");
    }

    const commentsaggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$ownerDetails"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {createdAt: -1}
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isliked: 1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(commentsaggregate , options);

    return res
            .status(200)
        .json(new ApiResponse(200, comments, "comments fatched successfully!!!"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body;
    const {videoId} = req.params;

    if (!content) {
        throw new ApiError(404 , "content not available!!!");
    }

    const video = Video.findById(videoId);

    if (!video) {
        throw new ApiError(404 , "video not found!!!");
    }

    const commnet = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });

    if (!commnet) {
        throw new ApiError(500 , "Error occured while adding commnet!!!");
    }

    return res
            .status(200)
            .json(new ApiResponse(200 , commnet , "Comment added SUccessfully!"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const {content} = req.body;

    if (!content) {
        throw new ApiError(400 , "content is required!!");
    }

    const commnet = await Comment.findById(commentId);

    if (!commnet) {
        throw new ApiError(404 , "commnet not found!!!");
    }

    if (commnet?.owner.toString() != req.user?._id.toString()) {
        throw new ApiError(400 , "onlly commnet owner can edit commnet");
    }

    const updatedCommnet = await Comment.findByIdAndUpdate(
        {_id: commentId},
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    );

    if (!updatedCommnet) {
        throw new ApiError(500 , "Error occured while upadting comment!!!");
    }

    console.log("updated comment :: " , updatedCommnet);
    
    return res
            .status(200)
            .json(new ApiResponse(200, updatedCommnet , "Commnet updated successfully!!"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    if (!commentId) {
        throw new ApiError(400 , "commnet ID is required!!!");
    }

    const commnet = await Comment.findById(commentId);

    if (!commnet) {
        throw new ApiError(404 , "COmmnet not found");
    }

    if (commnet.owner.toString() != req.user?._id.toString()) {
        throw new ApiError(400 , "only owner can delete comment!!");
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({
        commnet: commentId,
        likedBy: req.user
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}