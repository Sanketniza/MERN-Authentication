/* 
 * In package.json , "type":"module", then import express from "express";
 * default "type":"commonjs" , then const express = require("express");
 */

import express from "express";
import dotenv, { config } from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./util/mongodb.js";
import { errorMiddleware } from "./middlewares/error.js";

// &----------------------------------------------------------------

const app = express();

dotenv.config();
config({ path: "./config.env" });

app.use(cors({
    origin: [process.env.FRONTEND_URL], // connect with frontend (we can join multiple frontend's in the same backend)
    methods: ["GET", "POST", "PUT", "DELETE"], // which methods to use
    credentials: true

}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form data , means data from frontend to backend in which the data is in the form of key-value pair (like name: value)


// &----------------------------------------------------------------

const port = process.env.PORT || 3000;
app.listen(port, () => {
    connectDB();
    console.log(`Server is running on port ${port}`);
});

// &----------------------------------------------------------------

app.use(errorMiddleware);