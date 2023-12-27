import express from "express";
import bodyParser from "body-parser";
import mongoose from 'mongoose'
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import dotenv from 'dotenv';
dotenv.config();

import authenticationRouter from "./router/authentication.router";


const app = express();
app.use(cors({
    credentials: true
}))

app.use(compression());
app.use(cookieParser())
app.use(bodyParser.json())

const server = http.createServer(app)


const MongoDB_PASSWORD: string | undefined = process.env.DATABASE_PASSWORD;
const MongoDB_URL: string | undefined = process.env.DATABASE_URL;

if (MongoDB_PASSWORD && MongoDB_URL) {
  const mongoUrlWithPassword = MongoDB_URL.replace('<password>', MongoDB_PASSWORD);

  mongoose.connect(mongoUrlWithPassword);

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => console.log('Connected to MongoDB'));

} else {
  console.error('DATABASE_PASSWORD or DATABASE_URL is not defined.');
}

app.use("/api/v1/" , authenticationRouter)

server.listen(3000 , () => {
    console.log("http://localhost:3000"); 
})