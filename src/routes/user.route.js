import { Router } from "express";
import { registerUser, deleteUserById } from "../controller/user.controller.js"
import { upload } from "../middleware/multer.middleware.js"


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

router.route("/delete-user").delete(deleteUserById)

export default router;