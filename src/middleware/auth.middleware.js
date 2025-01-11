import {asyncHandler} from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {COOKIE_NAME} from "../constant.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,_,next)=>{

     const {refershToken,accessToken} = COOKIE_NAME

     try {
          const token = req.cookies?.accessToken || req.header("Authorization")?.substring(8)

          if(!token){
               throw new ApiError(401,"Unauthorized request")
          }

          const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

          const user = await User.findById(decodedToken?._id).select("-password refershToken")

          if(!user){
               throw new ApiError(401,"Invalid access token")
          }

          req.user = user

          next()

     } catch (error) {
          throw new ApiError(401, error?.message || "Invalid access token")
     }
})