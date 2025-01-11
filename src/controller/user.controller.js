import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { COOKIE_NAME } from "../constant.js"

const generateAccessTokenAndRefreshToken = async (userId) => {

     try {
          const user = await User.findById(userId)

          const accessToken = user.generateAccessToken()

          const refershToken = user.generateRefreshToken()

          user.refershToken = refershToken

          await user.save({
               validateBeforeSave: false
          })

          return { accessToken, refershToken }

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

          const createdUser = await User.findById(user._id).select("-password -refershToken")

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
     const user = await User.findOne(
          $or = [{ username }, { email }]
     )

     if (!user) {
          throw new ApiError(400, "User does not exists")
     }

     //password check

     const isPasswordValid = user.isPasswordCorrect(password)

     if (!isPasswordValid) {
          throw new ApiError(400, "Invalid password")
     }

     //access and referesh token
     const { accessToken, refershToken } = await generateAccessTokenAndRefreshToken(user._id)

     // get new user as old one don't have access to the rerfesh token in db
     const loggedInUser = await User.findById(user._id).select("-password -refershToken")

     const options = {
          httpOnly: true,
          secure: true
     }

     //send cookie

     return res
          .status(200)
          .cookie(COOKIE_NAME.accessToken, accessToken, options)
          .cookie(COOKIE_NAME.refershToken, refershToken, options)
          .json(
               new ApiResponse(
                    200,
                    {
                         user: loggedInUser,
                         accessToken,
                         refershToken
                    },
                    "User logged in successfully."
               )
          )
})

const logoutUser = asyncHandler(async (req, res) => {
     await User.findByIdAndUpdate(
          req.user._id,
          {
               refershToken: undefined
          },
          {
               new: true
          }
     )


     const options = {
          httpOnly: true,
          secure: true
     }

     return res
          .status(200)
          .clearCookie(COOKIE_NAME.accessToken, options)
          .clearCookie(COOKIE_NAME.refershToken, options)
          .json(new ApiResponse(200, {}, "User logged out successfully"))
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

export { registerUser, deleteUserById, loginUser, logoutUser }
