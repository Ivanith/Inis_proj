import { Response, Request, json, query } from "express";
import mongoose from "mongoose";
import GameModel from "../models/Game";
import UserModel from "../models/User";

export const create = async (req: Request, res: Response) => {
  try {
    const doc = new GameModel({
      duration: req.body.duration,
      rounds: req.body.rounds,
      numberOfPlayers: req.body.numberOfPlayers,
      players: req.body.players,
      gameSpeed: req.body.gameSpeed,
      ranked: req.body.ranked,
      winner: req.body.winner,
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
