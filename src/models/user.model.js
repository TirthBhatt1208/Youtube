import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const imageSchema = new Schema({
    url: {
        type: String
    },
    public_id: {
        type: String
    }

})

const userSchema = new Schema( 
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: imageSchema,
            required: true
        },
        coverimage: {
            type: imageSchema, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }],
        password: {
            type: String,
            required: [true , "Password is required!"]
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)


//to just hash our password before save we will use pre hook pre is a middleware
// pre accepts what to do and call back but in call back we wil not use arrow function
// because we have to manipulate data in call back so we need contex and in arrow function we can not use this keyword

userSchema.pre("save" , async function (next) {

    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password , 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password);
}


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User" , userSchema);