import { json, query } from "express";
import mongoose from "mongoose";
import messageModel from "../models/Message.js";
import ChatModel from "../models/Chat.js";
import UserModel from "../models/User.js";


export const allMessages = async (req, res) => {
    try {
      const messages = await messageModel.find({ chat: req.params.chatId })
        .populate("sender", "userName avatarUrl email")
        .populate("chat");
      res.json(messages);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  };

export const sendMessage = async (req, res) => {
    const { content, chatId } = req.body;
  
    if (!content || !chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
    }
  
    var newMessage = {
      sender: req.userId,
      content: content,
      chat: chatId,
    };
  
    try {
        var message = await messageModel.create(newMessage);
      
        message = await messageModel.findById(message._id)
          .populate("sender", "userName avatarUrl")
          .populate("chat")
          .exec();
      
        message = await UserModel.populate(message, {
          path: "chat.users",
          select: "userName avatarUrl email",
        });
      
        await ChatModel.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
      
        res.json(message);
      } catch (error) {
        res.status(400);
        throw new Error(error.message);
      }
  };
  