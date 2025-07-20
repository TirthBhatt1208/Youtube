import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



const uploadOnCloudinary = async (localFilePath, resource_type = "image") => {
    try {
        if(!localFilePath) return null;

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: `${resource_type}`
        })

        // file has successfully uploaded on cloudinary
        console.log("Url: " , response.url);
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        //if we here in catch block that means we have a file in server
        //but we have to delete that file otherwise there are many mislinious file can create problem

        fs.unlinkSync(localFilePath) // we will delete the file
        return null;
    }
}

const deleteOnCloudinary = async (cloudinaryPublic_id, resource_type = "image") => {

    // console.log("undifind!!" , unlinkPath);
    // const parts = unlinkPath.split("/upload/")[1].split("/");
    // console.log(parts);
    // parts.shift(); // Remove version part like "v1712345678"
    // const withExt = parts.join("/"); // "user_images/profile_abc123.jpg"
    // console.log(withExt);
    // const publicId = withExt.replace(/\.[^/.]+$/, "");
    // console.log(publicId);

    const deletedFile = await cloudinary.uploader
        .destroy(cloudinaryPublic_id, {
            resource_type: `${resource_type}`
        })
        .then(result => {
            console.log(result);
        });

    return deletedFile;
}

export { uploadOnCloudinary , deleteOnCloudinary }