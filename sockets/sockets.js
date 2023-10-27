export default function handleSocketConnections(io) {
  // Dictionary to store lobbies by lobby ID
  const lobbies = {};

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    function updateLobbyList() {
      const lobbyList = Object.keys(lobbies).map((lobbyId) => ({
        id: lobbyId,
        name: lobbies[lobbyId].name,
        players: lobbies[lobbyId].players.length,
        maxPlayers: lobbies[lobbyId].maxPlayers,
        owner: lobbies[lobbyId].owner,
        gameSpeed: lobbies[lobbyId].gameSpeed,
        isRanked: lobbies[lobbyId].isRanked,
      }));
      io.emit("lobby list", lobbyList);
    }

    socket.on("create lobby", ({ lobbyName, maxPlayers, gameSpeed, isRanked }) => {
      const lobbyId = generateRandomLobbyId();
      lobbies[lobbyId] = {
        name: lobbyName,
        maxPlayers: maxPlayers,
        owner: socket.id,
        players: [{ id: socket.id, isReady: false }],
        messages: [],
        gameSpeed: gameSpeed,
        isRanked: isRanked === true, // Ensure isRanked is set to true or false
      };
      socket.join(lobbyId);
      socket.emit("lobby created", lobbyId);
      console.log(`Lobby created: ${lobbyId}`);
      updateLobbyList();
    });

    socket.on("join lobby", ({ lobbyId }) => {
      if (lobbies[lobbyId] && lobbies[lobbyId].players.length < lobbies[lobbyId].maxPlayers) {
        lobbies[lobbyId].players.push({ id: socket.id, isReady: false });
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
        const playerName = socket.id;
        const messageObject = { playerName, message };
        lobbies[lobbyId].messages.push(messageObject);
        io.to(lobbyId).emit("new message", messageObject);
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
      if (lobbies[lobbyId] && lobbies[lobbyId].owner === socket.id) {
        lobbies[lobbyId].isRanked = !lobbies[lobbyId].isRanked; // Toggle isRanked status
        io.to(lobbyId).emit("isRankedOptionModified", { lobbyId, isRanked: lobbies[lobbyId].isRanked });
      }
    });

    socket.on("setGameSpeed", ({ lobbyId, gameSpeed }) => {
      if (lobbies[lobbyId] && lobbies[lobbyId].owner === socket.id) {
        const gameSpeedOptions = ["slow", "medium", "fast"];
        if (gameSpeedOptions.includes(gameSpeed)) {
          lobbies[lobbyId].gameSpeed = gameSpeed;
          io.to(lobbyId).emit("gameSpeedSettingModified", { lobbyId, gameSpeed });
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

      const lobbyId = Object.keys(lobbies).find((lobbyId) => lobbies[lobbyId].owner === socket.id);
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
