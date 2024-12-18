import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

// cloudinary configuration
cloudinary.config({ 
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
     api_key: process.env.CLOUDINARY_API_KEY, 
     api_secret: process.env.CLOUDINARY_SECRET
 });

// file upload
const uploadOnCloudinary = async (localFilepath)=>{
     try {
          if(!localFilepath){
               return null;     
          }

          const response = await cloudinary.uploader.upload(localFilepath,{
               resource_type:"auto"
          });

          console.log("File uploaded successfully!!!",response);

          return response;
     } catch (error) {
          fs.unlinkSync(localFilepath); // removes the locally saved temporary file as the upload operation got failed

          return null;
     }
}
