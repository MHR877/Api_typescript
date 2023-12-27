import express from "express";
import {
  deletUserById,
  getUserByIdAndUpdate,
  getUsers,
} from "../module/user.schema";

export const getAllUsers = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers();

    if (!users) throw new Error("There is no users!");

    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.sendStatus(404).json({
      status: "faild",
      message: "Can't get users!",
    });
  }
};

export const getUserAndUpdateIt = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { email, username, password } = req.body;
    const users = await getUserByIdAndUpdate(id, {
      username,
      email,
      password,
    });

    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.sendStatus(404).json({
      status: "faild",
      message: "Can't get users!",
    });
  }
};

export const getUserAndDeletIt = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    await deletUserById(id);

    res.status(203).json({
      message: "Done",
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(404).json({
      status: "faild",
      message: "Can't get users!",
    });
  }
};
