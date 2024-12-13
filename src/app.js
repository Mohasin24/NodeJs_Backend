import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { LIMIT } from "./constant.js";

const app = express();

// Middlewares

app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
}));

app.use(express.json({
     limit: LIMIT
}));

app.use(express.urlencoded({
     extended: true,
     limit: LIMIT
}));

app.use(express.static("public"));

app.use(cookieParser());

export default app