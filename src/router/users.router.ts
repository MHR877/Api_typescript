import { getAllUsers } from "controllers/authentication.controller";
import {
  getUserAndDeletIt,
} from "controllers/users.controller";
import express from "express";

const usersRouter = express.Router();

usersRouter
  .get("/users", getAllUsers)
  .post("/users/delete/:id", getUserAndDeletIt);

export default usersRouter;
