import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary , deleteOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);

        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token Generation Error:", error);
        throw new ApiError(500, "Somthing went wrong while generating access or refresh token!!!", error);
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //1.get user detail from frontend
    //2.validation -> not empty
    //3.check user already exits
    //4.check for images and check for avatar
    //5.upload on cloudinary
    //6.create user object -> create entry in DB
    //7.remove password and refreshtoken field from response
    //8.check for user creation
    //9.return response


    //1.
    const { username, email, password, fullName } = req.body // from .body we can get data from forms and json for url data we see in next part
    //console.log("req.body :: ", req.body);


    //2.
    if ([username, email, password, fullName].some(
        (field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All Fields are required!!!");
    }

    //console.log("fullName: ", fullName.trim() === "");
    //3.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    //console.log("existedUser :: ", existedUser);

    if (existedUser) {
        throw new ApiError(409, "Username or email Already exists");
    }

    //4. , 5.
    /*
        When you use upload.fields([...]) from multer, the shape of req.files becomes:
        req.files = {
                avatar: [ { ...fileInfo } ],
                coverImage: [ { ...fileInfo } ]
                    }
    */
    // console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required!! please upload it")
    }
    // console.log("req.files: ", req.files);

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!!")
    }
    //console.log("avatar ::", avatar);
    //console.log("coverImage ::", coverImage);
    //6. , 7. , 8.
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        password,
        email,
        avatar: {
            'url': avatar.url,
            'public_id': avatar.public_id
        },
        coverimage: {
            'url': coverImage?.url || "",
            'public_id': coverImage?.public_id || ""
        },
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Somthing went wrong while registring User!!!");
    }

    //9.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registred Successfully!!")
    )





    // res.status(200).json({
    //     message: "ok"
    // })
})

const loginUser = asyncHandler(async (req, res) => {

    //req body -> data
    //username or email
    //find username or email
    //check password
    //access and refresh token to user
    //send cookie

    // get data
    const { username, email, password } = req.body;
    console.log(username);
    //check data
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required!!!");
    }

    //find data for already exits
    const user = await User.findOne({
        $and: [{ username }, { email }]
    })

    //check for already exits or not
    if (!user) {
        throw new ApiError(404, "You are not Registerd!!!");
    }

    //check password
    if (!password) {
        throw new ApiError(400, "password is required!!!");
    }

    //check password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect!!!");
    }

    //get access and refresh token
    // console.log(user._id)
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // now here we can send user but in user refreshToekn field will be empty because of
    // we create access and refresh token below user object

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //send response
    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "User successfully logged In!!")
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(201, {}, "User Logged Out Successfully!!")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRereshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!inComingRereshToken) {
        throw new ApiError(401, "unAuthorized request!!!");
    }

    try {
        const decodedToken = jwt.verify(inComingRereshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token!!");
        }

        console.log("incomingtoken: " , inComingRereshToken);
        console.log("usertoken: " , user?.refreshToken)
        if (inComingRereshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or Alreadt used!!");
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .json(
                new ApiResponse(201, { accessToken, refreshToken: newRefreshToken }, " Access Token refreshed Successfully!!")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid Refresh Token!!")
    }
})

const changeCurrentpassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Wrong Password!!!");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password is changed successfully!!!"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User Fetched Successfully!!!"));
})

const updateAccountdetails = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All Field Are Required!!!!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {
            new: true // it will return all values after updation
        }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Detail Updated successfully!!!"));
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing!!!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar!!!");
    }
   
    const avatarUrl = await User.findById(req.user?._id).select("-password -refreshToken");
    //console.log(avatarUrl.avatar);
    const deletPath = await deleteOnCloudinary(avatarUrl.avatar.public_id);
    //console.log(deletPath);
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: {
                    'url': avatar.url,
                    'public_id': avatar.public_id
                }
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated Successfully!!!"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path
    //console.log(req.file);
    
    //console.log(coverImageLocalPath);

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing!!!");
    }

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);
    //console.log("New Cover Image :: " , newCoverImage);
    

    if (!newCoverImage.url) {
        throw new ApiError(400, "Error while uploading cover image!!!");
    }

    //console.log(req.user?._id);

    const coverImage = await User.findById(req.user?._id).select("-password -refreshToken");
    //console.log(coverImage.coverimage.public_id);
    
    const deletedFile = await deleteOnCloudinary(coverImage.coverimage.public_id);
    //console.log(deletedFile);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverimage: {
                    "url": newCoverImage.url,
                    'public_id': newCoverImage.public_id
                }
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image Updated Successfully!!!"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    console.log("req.params =", req.params);
    console.log("req.query =", req.query);

    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(401, "username is missing!!!");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedTocount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedTocount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverimage: 1,
                email: 1
            }
        }
    ])

    //console.log(channel);
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not Exits!!!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully!!!"));
})

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory), "Watch history fetched successfully!!");
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentpassword,
    getCurrentUser,
    updateAccountdetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};