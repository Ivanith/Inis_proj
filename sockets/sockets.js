import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import axios from 'axios';
import jwt from "jsonwebtoken";
import { handleLobbyEvents } from "./events/lobbyEvents.js";
import { lobbies } from "../utils/lobbies.js";
import { updateLobbyList } from "../utils/socketFunctions.js";
export default function handleSocketConnections(io)
{
  io.on("connection", (socket) =>
  {
    // console.log("Connected to socket.io");
    //login part
    socket.auth = false;
    socket.on("authenticate", async (token) =>
    {
      const { _id } = jwt.verify(token, "secret123");
      const user = await UserModel.findById(_id).exec();
      if (!user)
      {
        socket.emit("error", { message: "No user found" });
        return;
      }
      socket.auth = true;
      socket.user = user;
    });

    handleLobbyEvents(io, socket);


    socket.on("disconnect", () =>
    {
      Object.entries(lobbies).forEach(([lobbyId, lobby]) =>
      {
        const player = lobby.players.find((player) => player.id === socket.id);
        if (player)
        {
          lobbies[lobbyId].players = lobby.players.filter((player) => player.id !== socket.id);
          io.to(lobbyId).emit("player-left", socket.id);
        }
      });

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner.id === socket.id);
      if (lobbyId)
      {
        delete lobbies[lobbyId];
      }
      updateLobbyList(io, getLobbyList(lobbies));
    });

  });
}
