import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
     {
          title: {
               type: String,
               required: [true, "Title is required!!"],
               trim: true,
               index: true
          },

          description: {
               type: String
          },

          duration: {
               type: Number,
               required: true
          },

          views: {
               type: Number,
               default:0,
          },

          isPublished: {
               type: Boolean,
               default:true
          },

          thumbnail: {
               type: String, //cloudinary url
               required: true
          },

          videoFile: {
               type: String, //cloudinary url
               required: true
          },

          owner: {
               type: Schema.Types.ObjectId,
               ref: "User"
          }
     },

     {
          timestamps: true
     }
);

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = new model("Video", videoSchema);