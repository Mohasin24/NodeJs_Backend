import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { options, ACCESS_TOKEN, REFRESH_TOKEN } from "../constant.js";
import mongoose, { mongo } from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {

     try {
          const user = await User.findById(userId)

          const accessToken = user.generateAccessToken()

          const refreshToken = user.generateRefreshToken()

          user.refreshToken = refreshToken

          await user.save({
               validateBeforeSave: false
          })

          return { accessToken, refreshToken }

     } catch (error) {
          throw new ApiError(500, "Something went wrong while generating referesh and access token")
     }

}

const registerUser = asyncHandler(
     async (req, res) => {

          // get user details from frontend
          // validation - check for empty fields
          // check if user already exists 
          // check for image and avatar
          // upload image and avtar on cloudinary
          // create user object - create entry in db
          // remove password and refresh token from the response
          // check if user is successfully created or not
          // ṛeturn the response

          const { username, email, fullname, password } = req.body

          if (
               [username, email, fullname, password].some(
                    (field) => (field?.trim() === "")
               )
          ) {
               throw new ApiError(400, "All fields are required!!")
          }

          const existingUser = await User.findOne({
               $or: [{ email }, { username }]
          }
          )

          if (existingUser) {
               throw new ApiError(409, "User already exists.")
          }

          const avatarLocalPath = req.files?.avatar[0]?.path
          const coverImageLoacalPath = req.files?.coverImage[0]?.path

          if (!avatarLocalPath) {

               throw new ApiError(400, "Avatar is required!")
          }

          const avatar = await uploadOnCloudinary(avatarLocalPath)
          const coverImage = await uploadOnCloudinary(coverImageLoacalPath)

          if (!avatar) {
               throw new ApiError(400, "Avatar file is required!")
          }

          const user = await User.create(
               {
                    username: username.toLowerCase(),
                    email,
                    fullname,
                    password,
                    avatar: avatar?.url,
                    coverImage: coverImage?.url || "",
               }
          )

          const createdUser = await User.findById(user._id).select("-password -refreshToken")

          if (!createdUser) {
               throw new ApiError(500, "Something went wrong while registrering the user")
          }

          return res.status(201).json(
               new ApiResponse(200, createdUser, "User created successfully!")
          );
     }
)

const loginUser = asyncHandler(async (req, res) => {

     // req body -> data
     const { username, email, password } = req.body

     // username or email
     if (!username && !email) {
          throw new ApiError(400, "Username or Email is required")
     }

     //find the user
     const user = await User.findOne({
          $or: [{ username }, { email }]
     })

     if (!user) {
          throw new ApiError(400, "User does not exists")
     }

     //password check

     const isPasswordValid = user.isPasswordCorrect(password)

     if (!isPasswordValid) {
          throw new ApiError(400, "Invalid password")
     }

     //access and referesh token
     const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

     // get new user as old one don't have access to the rerfesh token in db
     const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     //send cookie

     return res
          .status(200)
          .cookie(ACCESS_TOKEN, accessToken, options)
          .cookie(REFRESH_TOKEN, refreshToken, options)
          .json(
               new ApiResponse(
                    200,
                    {
                         user: loggedInUser,
                         accessToken,
                         refreshToken
                    },
                    "User logged in successfully."
               )
          )
})

const logoutUser = asyncHandler(async (req, res) => {
     await User.findByIdAndUpdate(
          req.user._id,
          {
               refreshToken: undefined
          },
          {
               new: true
          }
     )

     return res
          .status(200)
          .clearCookie(ACCESS_TOKEN, options)
          .clearCookie(REFRESH_TOKEN, options)
          .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

     console.error(req.cookies)
     console.error(incomingRefreshToken)

     if (!incomingRefreshToken) {
          throw new ApiError(
               401,
               "Unauthorized request"
          )
     }

     try {
          const decodedToken = jwt.verify(
               incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
          )

          const user = await User.findById(decodedToken?._id)

          if (!user) {
               throw new ApiError(401, "Invalid refresh token")
          }

          if (incomingRefreshToken !== user.refreshToken) {
               throw new ApiError(401, "Refresh token is expired or used")
          }

          const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user?._id)

          return res
               .status(200)
               .cookie(ACCESS_TOKEN, accessToken, options)
               .cookie(REFRESH_TOKEN, newRefreshToken, options)
               .json(new ApiResponse(
                    200,
                    {
                         accessToken,
                         refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
               ))

     } catch (error) {
          throw new ApiError(401, error?.message || "Invalid refresh token")
     }
})

const deleteUserById = asyncHandler(
     async (req, res) => {
          const { username } = req.body

          console.log(req.body)

          const result = await User.deleteOne({
               username
          })

          if (result.deletedCount === 0) {
               throw new ApiError(500, "User not deleted")
          }

          return res.status(200).json(
               new ApiResponse(201, result, "User deleted successfully!")
          )
     }
)

const changeUserCurrentPassword = asyncHandler(async (req, res) => {

     const { oldPassword, newPassword } = req.body

     const user = await User.findById(req.user?._id)

     const isPasswordCorrect = await isPasswordCorrect(oldPassword)

     if (!isPasswordCorrect) {
          throw new ApiError(400, "Invalid old password!")
     }

     user.password = newPassword

     await user.save({ validateBeforeSave: false })

     return res
          .status(200)
          .json(new ApiResponse(200, {}, "Password changed successfully!"))

})

const getCurrentLoggedInUser = asyncHandler(async (req, res) => {
     return res
          .status(200)
          .json(new ApiResponse(200, req.user, "Current loggedIn User fetched successfully!"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
     const { fullname, email } = req.body

     if (!(fullname || email)) {
          throw new ApiError(400, "All fields are required!")
     }

     const user = await User.findByIdAndUpdate(
          req.user._id,
          {
               $set: {
                    fullname,
                    email
               }
          },
          {
               new: true
          }
     ).select("-password -refreshToken")

     return res
          .status(200)
          .json(new ApiResponse(200, user, "Account details updated successfully!"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
     const avatarLocalPath = req.file?.path

     if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar file is missing!")
     }

     //TODO: delete old image - assignment

     const avatar = await uploadOnCloudinary(avatarLocalPath)

     if (!avatar.url) {
          throw new ApiError(400, "Error while uploading avatar file on server")
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    avatar: avatar.url
               }
          },
          {
               new: true
          }
     ).select("-password -refreshToken")

     return res
          .status(200)
          .json(new ApiResponse(200, user, "Avatar updated successfully!"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
     const coverImageLoacalPath = req.file?.path

     if (!coverImageLoacalPath) {
          throw new ApiError(400, "Cover Image file is missing!")
     }

     //TODO: delete old image - assignment

     const coverImage = await uploadOnCloudinary(coverImageLoacalPath)

     if (!coverImage.url) {
          throw new ApiError(400, "Error while uploading cover image file on server")
     }

     const user = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    coverImage: coverImage.url
               }
          },
          {
               new: true
          }
     ).select("-password -refreshToken")

     return res
          .status(200)
          .json(new ApiResponse(200, user, "Cover Image updated successfully!"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
     const { username } = req.params

     if (!username.trim()) {
          throw new ApiError(400, "Username is missing")
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
                    subscribersCount: {
                         $size: "$subscribers"
                    },

                    channelSubscribedToCount: {
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
                    fullname: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1
               }
          }
     ])

     if (!channel?.length) {
          throw new ApiError(404, "Channel does not exists")
     }

     return res
          .status(200)
          .json(
               new ApiResponse(
                    200,
                    channel[0],
                    "User channel fetched successfully!"
               )
          )
})

const getUserWatchHistory = asyncHandler(async (req, res) => {
     const user = await User.aggregate([
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
                                                  fullname: 1,
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
     ])

     return res
     .status(200)
     .json(new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
     ))
})



export {
     registerUser,
     deleteUserById,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeUserCurrentPassword,
     getCurrentLoggedInUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile,
     getUserWatchHistory
}
