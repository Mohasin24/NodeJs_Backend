import { Router } from "express";
import {
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
} from "../controller/user.controller.js"
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const router = Router();

router.route("/register").post(
     upload.fields(
          [
               {
                    name: "avatar",
                    maxCount: 1
               },
               {
                    name: "coverImage",
                    maxCount: 1
               }
          ]
     ),
     registerUser
)

router.route("/login").post(loginUser)

router.route("/delete-user").delete(deleteUserById)

// Secured Routes

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeUserCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentLoggedInUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload,updateUserAvatar)

router.route("/cover-image").patch(verifyJWT,upload,updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getUserWatchHistory)

export default router;