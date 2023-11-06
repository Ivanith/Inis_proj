import UserModel from "../models/User.js";
import bcrypt from "bcrypt";

export default function handleSocketConnections(io) {
  // Dictionary to store lobbies by lobby ID
  const lobbies = {};

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    //login part
    socket.auth = false;
    socket.on("authenticate", async (auth) => {
      const { username, password } = auth;
      const user = await UserModel.findOne({userName: username }).exec();
      console.log(user);
      console.log(password);
      const isValidPass = await bcrypt.compare(
        password,
        user.passwordHash
      ); 
      if (user === null) {
        socket.emit("error", { message: "No user found" });
      } else if (!isValidPass) {
        socket.emit("error", { message: "Wrong password" });
      } else {
        socket.auth = true;
        socket.user = user;
        console.log('you are logged in');
      }
    });
    
    function updateLobbyList() {
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

    socket.on("create lobby", async ({ lobbyName, maxPlayers, gameSpeed, isRanked }) => {
      if (socket.auth) {
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
        socket.emit("lobby created", lobbyId);
        console.log(`Lobby created: ${lobbyId}`);
        updateLobbyList();
      }
    });
    

    socket.on("join lobby", ({ lobbyId }) => {
      if (lobbies[lobbyId] && lobbies[lobbyId].players.length < lobbies[lobbyId].maxPlayers) {
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
        socket.emit("lobby joined", lobbyId);
        console.log(`User joined Lobby: ${lobbyId}`);
        updateLobbyList();
      } else {
        socket.emit("lobby full");
      }
    });

    socket.on("send message", ({ lobbyId, message }) => {
      if (lobbies[lobbyId]) {
        const playerIndex = lobbies[lobbyId].players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
        const playerName = socket.user ? socket.user.userName : socket.id;
        const messageObject = { playerName, message };
        lobbies[lobbyId].messages.push(messageObject);
        io.to(lobbyId).emit("new message", messageObject);
      } else {
        socket.emit("error", { message: "You are not in this lobby" });
      }
      }
    });

    socket.on("request lobby list", () => {
      updateLobbyList();
    });

    socket.on("isReady", ({ lobbyId }) => {
      if (lobbies[lobbyId]) {
        const playerIndex = lobbies[lobbyId].players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          lobbies[lobbyId].players[playerIndex].isReady = !lobbies[lobbyId].players[playerIndex].isReady;
          io.to(lobbyId).emit("player status", { playerId: socket.id, isReady: lobbies[lobbyId].players[playerIndex].isReady });
        }
    
        const playersReady = lobbies[lobbyId].players.filter((player) => player.isReady);
        if (playersReady.length === lobbies[lobbyId].maxPlayers) {
          io.to(lobbyId).emit("lobby ready", lobbies[lobbyId]);
        }
      }
    });
    

    socket.on("setRankedOption", ({ lobbyId }) => {
      if (lobbies[lobbyId] && lobbies[lobbyId].owner.id === socket.id) {
        lobbies[lobbyId].isRanked = !lobbies[lobbyId].isRanked; // Toggle isRanked status
        io.to(lobbyId).emit("isRankedOptionModified", { lobbyId, isRanked: lobbies[lobbyId].isRanked });
        updateLobbyList();
      }
    });

    socket.on("setGameSpeed", ({ lobbyId, gameSpeed }) => {
      if (lobbies[lobbyId] && lobbies[lobbyId].owner.id === socket.id) {
        const gameSpeedOptions = ["slow", "medium", "fast"];
        if (gameSpeedOptions.includes(gameSpeed)) {
          lobbies[lobbyId].gameSpeed = gameSpeed;
          io.to(lobbyId).emit("gameSpeedSettingModified", { lobbyId, gameSpeed });
          updateLobbyList();
        }
      }
    });

    socket.on("lobbyDisconnect", () => {
      Object.keys(lobbies).forEach((lobbyId) => {
        const playerIndex = lobbies[lobbyId].players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          lobbies[lobbyId].players.splice(playerIndex, 1);
          io.to(lobbyId).emit("player left", socket.id);
        }
      });

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner.id === socket.id);
      if (lobbyId) {
        delete lobbies[lobbyId];
      }

      updateLobbyList();
    });

    socket.on("disconnect", () => {
      Object.keys(lobbies).forEach((lobbyId) => {
        const playerIndex = lobbies[lobbyId].players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          lobbies[lobbyId].players.splice(playerIndex, 1);
          io.to(lobbyId).emit("player left", socket.id);
        }
      });

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner.id === socket.id);
      if (lobbyId) {
        delete lobbies[lobbyId];
      }

      updateLobbyList();
    });

  });


  function generateRandomLobbyId() {
    return Math.random().toString(36).substr(2, 9);
  }
 

}
