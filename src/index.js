import dotenv from "dotenv";
import app from "./app.js"
import connectDB from "./db/DbConnection.js";

dotenv.config({
     path: "./.env"
});

const PORT = process.env.PORT || 0;

connectDB()
     .then(() => {
          app.on("error", (error) => {
               console.error("Error", error)
          })

          app.listen(PORT, () => {
               console.log(`Listening on port ${PORT}`);
          })
     })
     .catch((error) => {
          console.log("Database connection error !!!", error);
          throw error;
     })

























/*
import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
import dotenv from "dotenv";

dotenv.config({
     path:'./.env'
})

const app = express();
const PORT = process.env.PORT || 0

; (
     async () => {
          try {
               await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

               app.on("error",(error)=>{
                    console.log("Error",error);
               })

               app.listen(PORT,()=>{
                    console.log(`Listening on port: ${PORT}`);
               })

          } catch (error) {
               console.error("DB Connection failed !!!", error);
               throw error;
          }
     }
)()
     */