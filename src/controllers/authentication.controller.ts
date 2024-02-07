import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { promisify } from "util";

import {
  IUser,
  User,
  getUsers,
} from "../module/user.schema";
import AppError from "./../utils/appError";
import catchAsync from "./../utils/catchAsync";
import Email  from "./../utils/email";

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (
  user: IUser,
  statusCode: number,
  req: express.Request,
  res: express.Response
) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  //  @ts-ignore
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const getAllUsers = async (
  _req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers();

    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.sendStatus(404).json({
      status: "faild",
      message: "Can't get users!",
    });
  }
};

export const register = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  console.log(newUser);

  createSendToken(newUser, 201, req, res);
});


export const login = catchAsync(
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400));
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, req, res);
  }
);

export const logout = (req: express.Request, res: express.Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

// export const protect = catchAsync(
//   async (
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction
//   ) => {
//     // 1) Getting token and check of it's there
//     let token;
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     } else if (req.cookies.jwt) {
//       token = req.cookies.jwt;
//     }

//     if (!token) {
//       return next(
//         new AppError("You are not logged in! Please log in to get access.", 401)
//       );
//     }

//     // 2) Verification token
//     // @ts-ignore
//     const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET!);

//     // 3) Check if user still exists
//     // @ts-ignore
//     const currentUser = await User.findById(decoded.id);
//     if (!currentUser) {
//       return next(
//         new AppError(
//           "The user belonging to this token does no longer exist.",
//           401
//         )
//       );
//     }

//     // 4) Check if user changed password after the token was issued
//     // @ts-ignore
//     if (currentUser.changedPasswordAfter(decoded.iat)) {
//       return next(
//         new AppError(
//           "User recently changed password! Please log in again.",
//           401
//         )
//       );
//     }

//     // GRANT ACCESS TO PROTECTED ROUTE
//     // @ts-ignore
//     req.user = currentUser;
//     res.locals.user = currentUser;
//     next();
//   }
// );

export const isLoggedIn = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        // @ts-ignore
        process.env.JWT_SECRET!
      );

      // 2) Check if user still exists
      // @ts-ignore
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      // @ts-ignore
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

export const forgotPassword = catchAsync(
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError("There is no user with email address.", 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/resetPassword/${resetToken}`;
      console.log(new Email(user , resetURL));
      
      await new Email(user, resetURL).sendPasswordReset();

        console.log(resetToken);
        
      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });

    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, req, res);
  }
);

export const updatePassword = catchAsync(
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // @ts-ignore

    
    // 1) Get user from collection
    // @ts-ignore
    const user = await User.findById(req.body._id).select("+password");

    // 2) Check if POSTed current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is wrong.", 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
  }
);
