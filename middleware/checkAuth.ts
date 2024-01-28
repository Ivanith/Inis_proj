import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel from "../models/User"; // Import the User model

export default async (req: Request, res: Response, next: NextFunction) => {
  const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");

  if (token) {
    try {
      const decoded = jwt.verify(token, "secret123") as JwtPayload;

      const user = await UserModel.findById(decoded._id).exec();

      if (!user) {
        return res.status(403).json({
          message: "user not found",
        });
      }

      if (user.banStatus) {
        return res.status(403).json({
          message: "You are banned",
        });
      }

      req.userId = decoded._id;
      next();
    } catch (e) {
      return res.status(403).json({
        message: "wrong token",
      });
    }
  } else {
    return res.status(403).json({
      message: "wrong token",
    });
  }
};
