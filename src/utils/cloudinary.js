import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv";

// check for this issue
// ///////////////////////////////////////////////////////
dotenv.config({
     path: "./.env"
});
// ///////////////////////////////////////////////////////

cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_SECRET
});

// file upload
const uploadOnCloudinary = async (localFilepath) => {
     try {
          if (!localFilepath) {
               return null;
          }

          const response = await cloudinary.uploader.upload(localFilepath, {
               resource_type: "auto"
          });

          console.log("File uploaded successfully!!!");

          // if (fs.existsSync(localFilepath)) {
          //                // fs.unlinkSync(decodeURIComponent(localFilepath))
          //                console.log("File deleted successfully.");
          //           } else {
          //                console.warn("File not found, nothing to delete.");
          //           }

          return response;
     } catch (error) {

          console.log(error)

          return null;
     }
     // finally {
     //      if (fs.existsSync(localFilepath)) {
     //           fs.unlinkSync(localFilepath)
     //           console.log("File deleted successfully.");
     //      } else {
     //           console.warn("File not found, nothing to delete.");
     //      }
     // }
}

export default uploadOnCloudinary

