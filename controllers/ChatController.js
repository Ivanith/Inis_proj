import { json, query } from "express";
import mongoose from "mongoose";
import ChatModel from "../models/Chat.js";
import UserModel from "../models/User.js";


export const accessChat = async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      console.log("UserId param not sent with request");
      return res.sendStatus(400);
    }
  
    var isChat = await ChatModel.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.userId } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-passwordHash")
      .populate("latestMessage");
  
    isChat = await UserModel.populate(isChat, {
      path: "latestMessage.sender",
      select: "userName avatarUrl email",
    });
  
    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.userId, userId],
      };
  
      try {
        const createdChat = await ChatModel.create(chatData);
        const FullChat = await ChatModel.findOne({ _id: createdChat._id }).populate(
          "users",
          "-passwordHash"
        );
        res.status(200).json(FullChat);
      } catch (error) {
        res.status(400);
        throw new Error(error.message);
      }
    }
  };
  

export const fetchChats = async (req, res) => {
    try {
      ChatModel.find({ users: { $elemMatch: { $eq: req.userId } } })
        .populate("users", "-passwordHash")
        .populate("latestMessage")
        .sort({ updatedAt: -1 })
        .then(async (results) => {
          results = await UserModel.populate(results, {
            path: "latestMessage.sender",
            select: "useName avatarUrl email",
          });
          res.status(200).send(results);
        });
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  };