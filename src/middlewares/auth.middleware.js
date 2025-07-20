import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler( async (req , _ , next) => {

    try {
        //console.log("working....")

        const token = 
        req.cookies?.accessToken 
            || 
        req.header("Authorization")?.replace("Bearer " , "");
        
        // console.log("working2....")
        // console.log("token: " , token);
        
        if(!token) {
            throw new ApiError(401 , "UnAuthorized request!!");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // console.log('decoded token: ' , decodedToken);
        // console.log("Decoded_id: " , decodedToken?._id);
        
        const user = await User.findById(decodedToken?._id)
                                .select("-password -refreshToken");
    
        if(!user) {
            throw new ApiError(401 , "Invalid Access Token!!");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.massage || "Invalid Token!!")
    }
})