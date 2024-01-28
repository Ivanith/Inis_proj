import { Request, Response, json, query } from "express";
import mongoose from "mongoose";
import ChatModel from "../models/Chat";
import UserModel from "../models/User";


export const accessChat = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  try {
    const isChat = await ChatModel.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.userId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-passwordHash')
      .populate('latestMessage')
      .exec();

    const populatedChat = await UserModel.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'userName avatarUrl email',
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        chatName: 'sender',
        isGroupChat: false,
        users: [req.userId, userId],
      };

      const createdChat = await ChatModel.create(chatData);
      const fullChat = await ChatModel.findOne({ _id: createdChat._id })
        .populate('users', '-passwordHash')
        .exec();

      res.status(200).json(fullChat);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


export const fetchChats = async (req: Request, res: Response) => {
  try {
    const chats = await ChatModel.find({ users: { $elemMatch: { $eq: req.userId } } })
      .populate('users', '-passwordHash')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .exec();

    const populatedChats = await UserModel.populate(chats, {
      path: 'latestMessage.sender',
      select: 'userName avatarUrl email',
    });

    res.status(200).send(populatedChats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};