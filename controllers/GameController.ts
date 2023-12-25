import { Response, Request, json, query } from "express";
import mongoose from "mongoose";
import GameModel from "../models/Game";
import UserModel from "../models/User";



const updateStats = async (gameObj: any) => {
  try {
    for (const playerId of gameObj.players) {
      const user = await UserModel.findById(playerId);

      if (!user) {
        console.log(`User with ID ${playerId} not found`);
        break;
      }
      var userGamesTotal = user.totalGames + 1;
      user.totalGames = userGamesTotal;
      var userWins;

      if (gameObj.winner.includes(playerId)) {
        userWins = (user.wins) + 1;
        user.wins = userWins;

        user.winrate = Math.round((userWins / userGamesTotal) * 100);

        user.rating = user.rating + 25;
      } else {

        userWins = (user.wins)

        user.winrate = Math.round((userWins / userGamesTotal) * 100);

        user.rating = user.rating - 25;
      }

      await user.save();
    }
  } catch (error) {
    console.log('Error updating statistics:', error);
  }
};



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

    await updateStats(post.toObject());

    res.json(post.toObject());
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "game creation error",
    });
  }
};


