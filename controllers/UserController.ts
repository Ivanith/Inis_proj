import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose, { SortOrder } from "mongoose";
import UserModel from "../models/User";
import GameModel from "../models/Game";
import { Types } from 'mongoose';
import { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      email: req.body.email,
      userName: req.body.userName,
      passwordHash: hash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret123",
      {
        expiresIn: "20d",
      }
    );

    const { passwordHash, ...userData } = user;


    res.json({
      ...userData,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "register error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (user.banStatus != true) {
      const isValidPass = await bcrypt.compare(
        req.body.password,
        user.passwordHash
      );

      if (!isValidPass) {
        return res.status(400).json({
          message: "Login or pass error",
        });
      }

      const token = jwt.sign(
        {
          _id: user._id,
        },
        "secret123",
        {
          expiresIn: "20d",
        }
      );

      const { passwordHash, ...userData } = user;

      res.json({
        ...userData,
        token,
      });
    } else { res.status(200).json({ message: "You have been banned", }); }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "autorization error",
    });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userId,
      {
        avatarUrl: req.body.avatarUrl,
        preferedColor: req.body.preferedColor,
        units: req.body.units,
        preferences: req.body.preferences,
      },
      { new: true } // This option returns the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    const { passwordHash, ...userData } = updatedUser;
    res.json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "update error",
    });
  }
};

export const updatePass = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isValidPass = await bcrypt.compare(
      req.body.password,
      user.passwordHash
    );

    if (isValidPass) {
      const newPassword = req.body.newPassword;
      const newSalt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, newSalt);

      const updatedUser = await UserModel.findByIdAndUpdate(req.userId, {
        passwordHash: newHash,
      });

      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const { passwordHash, ...userData } = updatedUser;
      return res.status(200).json({
        message: "Password changed successfully",
      });
    } else {
      return res.status(403).json({
        message: "Wrong password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Update error",
    });
  }
};

export const addFriend = async (req: Request, res: Response) => {
  try {
    const friendId = req.params.id;
    const userId = req.userId;

    const user = await UserModel.findById(userId);
    if (!user) {
      return;
    }
    if (userId == friendId) { return res.status(200).json({ message: "You cant add yourself!" }); }
    if (user.friends.includes(new Types.ObjectId(friendId))) {
      return res.status(200).json({ message: "You are already friends!" });
    }
    user.friends.push(new Types.ObjectId(friendId));
    await user.save();

    res.status(200).json({ message: "Friend added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add friend", error });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const friendId = req.params.id;
    const userId = req.userId;

    const user = await UserModel.findById(userId);
    if (!user) {
      return;
    }
    if (!user.friends.includes(new Types.ObjectId(friendId))) {
      return res.status(400).json({ message: "You are not friends!" });
    }

    const friendObjectId = new mongoose.Types.ObjectId(friendId);
    user.friends = user.friends.filter((id) => !id.equals(friendObjectId));
    await user.save();

    return res.status(200).json({ message: "friend removed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to remove friend", error });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const default_lim = 10;

    const excludeFields = ["passwordHash", "__v", "createdAt", "updatedAt"];

    const user = await UserModel.findById(req.userId).select(
      excludeFields.map((field) => "-" + field).join(" ")
    );

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    // games part
    const games = await GameModel.find({ players: req.userId })
      .skip(skip)
      .limit(default_lim)
      .exec();

    const { passwordHash, ...userData } = user.toObject();

    res.json({ user: userData, games });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "permission denied",
    });
  }
};

export const updateBanStatus = async (req: Request, res: Response) => {
  try {
    const updUserId = req.params.id;
    const excludeFields = ["passwordHash", "__v", "createdAt", "updatedAt"];

    const user = await UserModel.findById(req.userId).select(
      excludeFields.map((field) => "-" + field).join(" ")
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({
        message: "You are not an admin",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      { _id: updUserId },
      {
        banStatus: req.body.banStatus,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { passwordHash, ...userData } = updatedUser;
    res.status(200).json({ message: "User banned", userData });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


export const getOneUser = async (req: Request, res: Response) => {
  const skip = req.query.skip ? Number(req.query.skip) : 0;
  const default_lim = 10;

  try {
    // User by id part
    const userId = req.params.id;

    const excludeFields = [
      "passwordHash",
      "email",
      "__v",
      "preferedColor",
      "units",
      "preferences",
      "createdAt",
      "updatedAt",
    ];
    const user = await UserModel.findById({ _id: userId }).select(
      excludeFields.map((field) => "-" + field).join(" ")
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Games from user part
    const games = await GameModel.find({ players: userId })
      .skip(skip)
      .limit(default_lim)
      .exec();

    const { passwordHash, ...userData } = user.toObject();
    res.json({ user: userData, games });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Permission denied",
    });
  }
};

export const searchUserByName = async (req: Request, res: Response) => {
  const name = new RegExp(req.params?.name, "i");

  if (req.params.name !== "") {
    try {
      const excludeFields = [
        "passwordHash",
        "email",
        "__v",
        "preferedColor",
        "units",
        "preferences",
        "createdAt",
        "updatedAt",
        "friends",
        "rating",
        "totalGames",
        "winrate",
        "wins",
      ];
      const search_results = await UserModel.find({ userName: name }).select(
        excludeFields.map((field) => "-" + field).join(" ")
      );
      res.status(200).json(search_results);
    } catch (error) {
      console.log(error);
      res.status(404).json({ message: "No mached user found" });
    }
  } else {
    res.status(404).json({ message: "Username for search not provided" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const sortOptions: { [key: string]: SortOrder } = { rating: -1 };

    const excludeFields = [
      "passwordHash",
      "avatarUrl",
      "email",
      "__v",
      "preferedColor",
      "units",
      "preferences",
      "createdAt",
      "updatedAt",
      "friends",
      "wins",
    ];

    const users = await UserModel.find()
      .select(excludeFields.map((field) => "-" + field).join(" "))
      .sort(sortOptions)
      .exec();

    console.log("Sorted Users:", users);

    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "users receive error",
    });
  }
};

