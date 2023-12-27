import {
  getAllUsers,
  login,
  register,
} from "../controllers/authentication.controller";
import express from "express";

const authenticationRouter = express.Router();

authenticationRouter
  .get("/auth", getAllUsers)
  .post("/auth/register", register)
  .post("/auth/login", login);

export default authenticationRouter;
