import mongoose from "mongoose";
import {DB_NAME} from "../constant.js"

const connectDB = async ()=>{
     try{
          await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
     }catch(error){
          console,error("MongoDB connection failed !!!",error);
          throw error(error);
     }
}

export default connectDB;