import express from "express";
import { get, identity, merge } from "lodash";
import { getUserBySessionToken } from "module/user.schema";

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
    try {
        const {id} = req.params
        //@ts-ignore
        const currentUserId : string = get(req , 'identity._id');

    
        if (!currentUserId) throw new Error("Error");
        if (!currentUserId.toString()) throw new Error("Error");
    
    
        return next();
      } catch (err) {
        console.log(err);
        return res.status(400).json({
          status: "faild",
        });
      }
};

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const sessionToken = req.cookies("MOH-AUTH");

    if (!sessionToken) throw new Error("The user is not loggin!");

    const existingUser = await getUserBySessionToken(sessionToken);

    if (!existingUser) throw new Error("There is no user!");

    merge(req, { identity: existingUser });

    return next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: "faild",
    });
  }
};
