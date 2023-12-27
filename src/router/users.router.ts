import { getAllUsers } from "controllers/authentication.controller";
import {
  getUserAndDeletIt,
  getUserAndUpdateIt,
} from "controllers/users.controller";
import express from "express";
import { isAuthenticated, isOwner } from "middlewares";

const usersRouter = express.Router();

usersRouter
  .get("/users", isAuthenticated, getAllUsers)
  .post("/users/delete/:id", isAuthenticated, isOwner, getUserAndUpdateIt)
  .post("/users/update/:id", isAuthenticated, isOwner, getUserAndDeletIt);

export default usersRouter;
