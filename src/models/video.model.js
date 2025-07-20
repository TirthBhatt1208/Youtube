import mongoose, { Schema } from "mongoose"
import  mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoschema = new Schema(
    {
        videoFile: {
            type: {
                url: String,
                public_id: String,
            },
            required: true,
        },
        thumbnail: {
            type: {
                url: String,
                public_id: String,
            },
            required: true,
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // cloudinary url
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublised: {
            type: Boolean,
            default:true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

videoschema.plugin(mongooseAggregatePaginate); // .plugin is a middelware
export const Video = mongoose.model("Video" , videoschema);