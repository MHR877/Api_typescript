import express from "express";
import { createUser, getUserByEmail, getUsers } from "../module/user.schema";
import { authenticate, generateRandomString } from "../utils";

export const getAllUsers = async (req: express.Request, res: express.Response) => {
  try {
    const users = await getUsers()

    res.status(200).json(users)
  }catch(err) {
    console.log(err);
    res.sendStatus(404).json({
      status: "faild",
      message: "Can't get users!",
    });
  }
}

export const register = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username)
      throw new Error("Something went wrong");

    const existingUser = await getUserByEmail(email);

    if (existingUser) throw new Error("The user exists");

    const salt = generateRandomString();
    const newUser = await createUser({
      username,
      email,
      authentication: {
        salt: salt,
        password: authenticate(salt, password),
      },
    });

    res.status(201).json({
      status: "success",
      user: newUser,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      message: "Can't register the user!",
    });
  }
};

export const login = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new Error("The email or password is missing");

    const user = await getUserByEmail(email);

    if (!user)
      throw new Error("There is no user with that email!");

    if (!user.authentication) {
      throw new Error("User authentication information is missing");
    }
    
    // @ts-ignore
    const expectedHash = authenticate(user.authentication.salt, password);

    if (user.authentication.password !== expectedHash)
      throw new Error("The password is incorrect");

    const salt = generateRandomString();

    if (!user.authentication) {
      throw new Error("User authentication information is missing");
    }

    user.authentication.sessionToken = authenticate(
      salt,
      user._id.toString()
    );
    await user.save();

    return res
      .cookie("MOH-AUTH", user.authentication.sessionToken, {
        domain: "localhost",
        path: "/",
      })
      .status(201)
      .json(user)
      .end();
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: "failed",
      message: "Can't login with this information",
    });
  }
};
