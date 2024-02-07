import express from "express";

type Fn = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;

const catchAsync = (fn: Fn) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;