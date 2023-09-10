import { json, query } from "express";
import mongoose from "mongoose";
import GameModel from "../models/Game.js";
import UserModel from "../models/User.js";

export const create = async (req, res) => {
  try {
    const doc = new GameModel({
      duration: req.body.duration,
      rounds: req.body.rounds,
      numberOfPlayers: req.body.numberOfPlayers,
      players: req.body.players,
      gameSpeed: req.body.gameSpeed,
      ranked: req.body.ranked,
      result: req.body.result,
      user: req.userId,
    });

    const post = await doc.save();

    res.json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "game creation error",
    });
  }
};
