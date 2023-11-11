import UserModel from "../models/User.js";
import bcrypt from "bcrypt";

const gameSpeedOptions = ["slow", "medium", "fast"];

export default function handleSocketConnections(io)
{
  function updateLobbyList()
  {
    const lobbyList = Object.keys(lobbies).map((lobbyId) => ({
      id: lobbyId,
      name: lobbies[lobbyId].name,
      numberOfPlayers: lobbies[lobbyId].players.length,
      players: lobbies[lobbyId].players,
      maxPlayers: lobbies[lobbyId].maxPlayers,
      owner: lobbies[lobbyId].owner,
      gameSpeed: lobbies[lobbyId].gameSpeed,
      isRanked: lobbies[lobbyId].isRanked,
    }));
    io.emit("lobby list", lobbyList);
  }

  const lobbies = {};

  io.on("connection", (socket) =>
  {
    console.log("Connected to socket.io");
    //login part
    socket.auth = false;
    socket.on("authenticate", async (auth) =>
    {
      const { username, password } = auth;
      const user = await UserModel.findOne({ userName: username }).exec();
      console.log(user);
      console.log(password);
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
        console.log('you are logged in');
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
          userId: socket.user.id,
          userName: socket.user.userName,
          rating: socket.user.rating,
          color: socket.user.preferedColor,
          winrate: socket.user.winrate
        },
        players: [
          {
            id: socket.id,
            userId: socket.user.id,
            userName: socket.user.userName,
            rating: socket.user.rating,
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
      console.log(`Lobby created: ${lobbyId}`);
      updateLobbyList();
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
      console.log(`User joined Lobby: ${lobbyId}`);
      updateLobbyList();
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
      if (!lobbies[socket.lobbyId].players.includes((player) => player.id === socket.id))
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
      updateLobbyList();
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
      const lobbyId = socket.lobbyId;
      if (!lobbies[lobbyId].player.includes((player) => player.id === socket.id))
      {
        return;
      }
      const playerIsReady = lobbies[lobbyId].players[playerIndex].isReady;
      lobbies[lobbyId].players[playerIndex].isReady = !playerIsReady;
      io.to(lobbyId).emit("player status", { playerId: socket.id, isReady: lobbies[lobbyId].players[playerIndex].isReady });

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
      if (!lobbies[socket.lobbyId].players.includes((player) => player.id === socket.id))
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
      updateLobbyList();
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
      if (!lobbies[socket.lobbyId].players.includes((player) => player.id === socket.id))
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
      updateLobbyList();
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
      if (!lobbies[socket.lobbyId].players.includes((player) => player.id === socket.id))
      {
        socket.emit("error", { message: "You are not in this lobby" });
        return;
      }
      const playerIndex = lobbies[socket.lobbyId].players.findIndex((player) => player.id === socket.id);
      lobbies[lobbyId].players.splice(playerIndex, 1);

      if (lobbies[socket.lobbyId].owner === socket.id)
      {
        delete lobbies[lobbyId];
      }
      io.to(lobbyId).emit("player left", socket.id);

      updateLobbyList();
    });

    socket.on("disconnect", () =>
    {
      Object.keys(lobbies).forEach((lobbyId) =>
      {
        const playerIndex = lobbies[lobbyId].players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1)
        {
          lobbies[lobbyId].players.splice(playerIndex, 1);
          io.to(lobbyId).emit("player left", socket.id);
        }
      });

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner.id === socket.id);
      if (lobbyId)
      {
        delete lobbies[lobbyId];
      }
      updateLobbyList();
    });

  });


  function generateRandomLobbyId()
  {
    return Math.random().toString(36).substr(2, 9);
  }


}
