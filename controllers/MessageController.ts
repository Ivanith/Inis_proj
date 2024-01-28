import { json, query } from "express";
import mongoose from "mongoose";
import messageModel from "../models/Message";
import ChatModel from "../models/Chat";
import UserModel from "../models/User";
import { Request, Response } from "express"

export const allMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageModel.find({ chat: req.params.chatId })
      .populate("sender", "userName avatarUrl email")
      .populate("chat")
      .exec();
    res.json(messages);
  } catch (error: any) {
    res.status(400);
    throw new Error(error.message);
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const newMessageBody = {
    sender: req.userId,
    content: content,
    chat: chatId,
  };

  try {
    const newMessage = await messageModel.create(newMessageBody);

    const message = await messageModel.findById(newMessage._id)
      .populate('sender', 'userName avatarUrl')
      .populate('chat')
      .exec();

    const users = await UserModel.populate(message, {
      path: 'chat.users',
      select: 'userName avatarUrl email',
    });

    await ChatModel.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
