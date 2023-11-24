import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import axios from 'axios';
const gameSpeedOptions = ["slow", "medium", "fast"];

function getLobbyList(lobbies)
{
  return Object.entries(lobbies).map(([lobby_Id, lobby]) =>
  (
    {
      id: lobby_Id,
      name: lobby.name,
      numberOfPlayers: lobby.players.length,
      players: lobby.players,
      maxPlayers: lobby.maxPlayers,
      owner: lobby.owner,
      gameSpeed: lobby.gameSpeed,
      isRanked: lobby.isRanked,
    }));
}
function updateLobbyList(io, lobbyList)
{
  io.emit("lobby list", lobbyList);
}

export default function handleSocketConnections(io)
{
  const lobbies = {};

  io.on("connection", (socket) =>
  {
    // console.log("Connected to socket.io");
    //login part
    socket.auth = false;
    socket.on("authenticate", async (auth) =>
    {
      const { username, password } = auth;
      const user = await UserModel.findOne({ userName: username }).exec();
      // console.log(user);
      // console.log(password);
      const isValidPass = await bcrypt.compare(
        password,
        user.passwordHash
      );
      if (user === null)
      {
        socket.emit("error", { message: "No user found" });
      } else if (!isValidPass)
      {
        socket.emit("error", { message: "Wrong password" });
      } else
      {
        socket.auth = true;
        socket.user = user;
        // console.log('you are logged in');
      }
    });
    socket.on("create lobby", async ({ lobbyName, maxPlayers, gameSpeed, isRanked }) =>
    {
      if (!socket.auth)
      {
        return;
      }
      const lobbyId = generateRandomLobbyId();
      lobbies[lobbyId] = {
        name: lobbyName,
        maxPlayers: maxPlayers,
        owner: {
          id: socket.id,
          userId: socket.user.id
        },
        players: [
          {
            id: socket.id,
            userId: socket.user.id,
            userName: socket.user.userName,
            mmr: socket.user.rating,
            color: socket.user.preferedColor,
            winrate: socket.user.winrate,
            isReady: false
          }
        ],
        messages: [],
        gameSpeed: gameSpeed,
        isRanked: isRanked,
      };
      socket.join(lobbyId);
      socket.lobbyId = lobbyId;
      socket.emit("lobby created", lobbyId);

      // console.log(`Lobby created: ${lobbyId}`);

      updateLobbyList(io, getLobbyList(lobbies));
    }
    );
    socket.on("join lobby", ({ lobbyId }) =>
    {
      if (!lobbies[lobbyId])
      {
        return;
      }
      if (lobbies[lobbyId].players.length >= lobbies[lobbyId].maxPlayer)
      {
        socket.emit("lobby full");
        return;
      }
      const playerInfo = {
        id: socket.id,
        userId: socket.user ? socket.user.id : null,
        userName: socket.user ? socket.user.userName : socket.id,
        rating: socket.user ? socket.user.rating : null,
        color: socket.user ? socket.user.preferedColor : null,
        winrate: socket.user ? socket.user.winrate : null,
        isReady: false,
      };
      lobbies[lobbyId].players.push(playerInfo);
      socket.join(lobbyId);
      socket.lobbyId = lobbyId;
      socket.emit("lobby joined", lobbyId);
      // console.log(`User joined Lobby: ${lobbyId}`);
      updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("send message", ({ message }) =>
    {
      if (!socket.auth)
      {
        return;
      }
      if (!socket.lobbyId)
      {
        return;
      }
      if (!lobbies.hasOwnProperty(socket.lobbyId))
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
      {
        socket.emit("error", { message: "You are not in this lobby" });
        return;
      }
      const playerName = socket.user ? socket.user.userName : socket.id;
      const messageObject = { playerName, message };
      lobbies[socket.lobbyId].messages.push(messageObject);
      io.to(socket.lobbyId).emit("new message", messageObject);


    });

    socket.on("request lobby list", () =>
    {
      updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("isReady", ({ }) =>
    {
      if (!socket.auth)
      {
        return;
      }
      if (!socket.lobbyId)
      {
        return;
      }
      if (!lobbies.hasOwnProperty(socket.lobbyId))
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
      {
        return;
      }
      const lobbyId = socket.lobbyId;
      const player = lobbies[lobbyId].players.find((player) => player.id === socket.id);
      player.isReady = !player.isReady;
      io.to(lobbyId).emit("player status", { playerId: socket.id, isReady: player.isReady });

      const everyPlayerIsReady = lobbies[lobbyId].players.every((player) => player.isReady);
      if (everyPlayerIsReady)
      {
        io.to(lobbyId).emit("lobby ready", lobbies[lobbyId]);
      }
    });

    socket.on("setRankedOption", ({ }) =>
    {
      if (!socket.auth)
      {
        return;
      }
      if (!socket.lobbyId)
      {
        return;
      }
      if (!lobbies.hasOwnProperty(socket.lobbyId))
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
      {
        socket.emit("error", { message: "You are not in this lobby" });
        return;
      }
      if (lobbies[socket.lobbyId].owner.id !== socket.id)
      {
        return;
      }
      const lobbyId = socket.lobbyId;
      const isRandked = lobbies[lobbyId].isRanked;
      lobbies[lobbyId].isRanked = !isRandked; // Toggle isRanked status
      io.to(lobbyId).emit("isRankedOptionModified", { lobbyId, isRanked: lobbies[lobbyId].isRanked });
      updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("setGameSpeed", ({ gameSpeed }) =>
    {
      if (!socket.auth)
      {
        return;
      }
      if (!lobbies[socket.lobbyId])
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
      {
        socket.emit("error", { message: "You are not in this lobby" });
        return;
      }
      if (lobbies[socket.lobbyId].owner.id !== socket.id)
      {
        return;
      }
      if (!gameSpeedOptions.includes(gameSpeed))
      {
        return;
      }
      const lobbyId = socket.lobbyId;
      lobbies[lobbyId].gameSpeed = gameSpeed;
      io.to(lobbyId).emit("gameSpeedSettingModified", { lobbyId, gameSpeed });
      updateLobbyList(io, getLobbyList(lobbies));
    }
    );

    socket.on("lobbyDisconnect", () =>
    {
      if (!socket.auth)
      {
        return;
      }
      if (!socket.lobbyId)
      {
        return;
      }
      if (!lobbies.hasOwnProperty(socket.lobbyId))
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
      {
        socket.emit("error", { message: "You are not in this lobby" });
        return;
      }

      lobbies[lobbyId] = lobbies[lobbyId].players.filter((player) => player.id !== socket.id);

      if (lobbies[lobbyId].owner === socket.id)
      {
        delete lobbies[lobbyId];
      }
      io.to(lobbyId).emit("player left", socket.id);

      updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("disconnect", () =>
    {
      Object.entries(lobbies).forEach(([lobbyId, lobby]) => {
        const player = lobby.players.find((player) => player.id === socket.id);
        if (player) {
          lobbies[lobbyId].players = lobby.players.filter((player) => player.id !== socket.id);
          io.to(lobbyId).emit("player left", socket.id);
        }
      });

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner.id === socket.id);
      if (lobbyId)
      {
        delete lobbies[lobbyId];
      }
      updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("start-game", async () =>
    {
      if (!socket.auth)
      {
        return;
      }
      if (!socket.lobbyId)
      {
        return;
      }
      if (!lobbies.hasOwnProperty(socket.lobbyId))
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
      {
        socket.emit("error", { message: "You are not in this lobby" });
        return;
      }
      if (lobbies[socket.lobbyId].owner.id !== socket.id)
      {
        return;
      }
      if (lobbies[socket.lobbyId].maxPlayers !== lobbies[socket.lobbyId].players.length)
      {
        return;
      }
      if (!lobbies[socket.lobbyId].players.every((player) => player.isReady))
      {
        return;
      }

      const lobbyId = socket.lobbyId;

      const players = lobbies[lobbyId].players.map((player) => ({
        id: player.id,
        username: player.userName,
        mmr: player.mmr || 1000,
        color: player.color || "Red",
      }));

      const body = {
        players: players,
        numPlayers: lobbies[lobbyId].maxPlayers
      }

      console.log(body);
      const res = await axios.post("http://localhost:8000/games", body);
      console.log(res.data);
    })

  });


  function generateRandomLobbyId()
  {
    return Math.random().toString(36).substr(2, 9);
  }
}
