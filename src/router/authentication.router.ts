import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updatePassword,
} from "../controllers/authentication.controller";
import express from "express";

const authenticationRouter = express.Router();

authenticationRouter
  .post("/register", register)
  .post("/login", login)
  .get("/logout", logout);

authenticationRouter.post("/forgotpassword", forgotPassword);
authenticationRouter.patch("/resetpassword/:token", resetPassword);
authenticationRouter.patch("/updatemypassword", updatePassword);

export default authenticationRouter;
