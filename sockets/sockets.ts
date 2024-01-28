import UserModel from "../models/User";
import bcrypt from "bcrypt";
import axios from 'axios';
import jwt, { JwtPayload } from "jsonwebtoken";
import { ICustomSocket, handleLobbyEvents } from "./events/lobbyEvents";
import { lobbies } from "../utils/lobbies";
import { updateLobbyList } from "../utils/socketFunctions";
import { getLobbyList } from "../utils/socketFunctions";
import { Server } from "socket.io";
export default function handleSocketConnections(io: Server) {
  io.on("connection", (socket: ICustomSocket) => {
    // console.log("Connected to socket.io");
    //login part
    socket.auth = false;
    socket.on("authenticate", async (token) => {
      try {
        const { _id } = jwt.verify(token, "secret123") as JwtPayload;
        const user = await UserModel.findById(_id).exec();
        if (!user) {
          socket.emit("error", { message: "No user found" });

          return;
        } else if (user.banStatus === true) {
          socket.emit("error", { message: "You are banned" });

          return;
        }

        socket.auth = true;
        socket.user = user;
      }
      catch (err) {
        console.log(err);
      }
    });

    handleLobbyEvents(io, socket);


    socket.on("disconnect", () => {
      Object.entries(lobbies).forEach(([lobbyId, lobby]) => {
        const player = lobby.players.find((player) => player.socketId === socket.id);
        if (player) {
          lobbies[lobbyId].players = lobby.players.filter((player) => player.socketId !== socket.id);
          io.to(lobbyId).emit("player-left", socket.id);
        }
      });

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner.SocketId === socket.id);
      if (lobbyId) {
        delete lobbies[lobbyId];
      }
      updateLobbyList(io, getLobbyList(lobbies));
    });

  });
}
