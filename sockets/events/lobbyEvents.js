import { generateRandomLobbyId } from "../../utils/socketFunctions.js";
import { getLobbyList } from "../../utils/socketFunctions.js";
import { getLobbyById } from "../../utils/socketFunctions.js";
import { updateLobbyList } from "../../utils/socketFunctions.js";
import { lobbies } from "../../utils/lobbies.js";
export function handleLobbyEvents(io, socket)
{
    socket.on("create-lobby", async ({ lobbyName, isPrivate, password }) =>
    {
        if (!socket.auth)
        {
            return;
        }
        const lobbyId = generateRandomLobbyId();
        lobbies[lobbyId] = {
            name: lobbyName,
            maxPlayers: 4,
            owner: {
                id: socket.id,
                userId: socket.user.id
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
            gameSpeed: "medium",
            isRanked: false,
            isPrivate: isPrivate,
            password: password || null,
        };
        socket.join(lobbyId);
        socket.lobbyId = lobbyId;
        socket.emit("lobby-created", lobbyId);

        updateLobbyList(io, getLobbyList(lobbies));
    }
    );
    socket.on("lobby-info", () =>
    {
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
        updateLobby(io, lobbyId, socket);
    })
    socket.on("join-lobby", ({ lobbyId, password }) =>
    {
        if (!lobbies[lobbyId])
        {
            return;
        }
        if (lobbies[lobbyId].players.length >= lobbies[lobbyId].maxPlayer)
        {
            socket.emit("lobby-full");
            return;
        }
        if (lobbies[lobbyId].isPrivate === true && lobbies[lobbyId].password !== password)
        {
            socket.emit("error", { message: "incorrect password" });
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
        socket.emit("lobby-joined", lobbyId);
        // console.log(`User joined Lobby: ${lobbyId}`);
        updateLobbyList(io, getLobbyList(lobbies));
        updateLobby(io, getLobbyById(lobbies, lobbyId), lobbyId, socket);
    });

    socket.on("send-message", ({ message }) =>
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
        io.to(socket.lobbyId).emit("new-message", messageObject);


    });

    socket.on("request-lobby-list", () =>
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
        io.to(lobbyId).emit("player-status", { playerId: socket.id, isReady: player.isReady });

        const everyPlayerIsReady = lobbies[lobbyId].players.every((player) => player.isReady);
        if (everyPlayerIsReady)
        {
            io.to(lobbyId).emit("lobby-ready", lobbies[lobbyId]);
        }
    });

    socket.on("set-RankedOption", ({ }) =>
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
        const isRanked = lobbies[lobbyId].isRanked;
        lobbies[lobbyId].isRanked = !isRanked; // Toggle isRanked status
        io.to(lobbyId).emit("isRankedOptionModified", { lobbyId, isRanked: lobbies[lobbyId].isRanked });
        updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("set-GameSpeed", ({ gameSpeed }) =>
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
        io.to(lobbyId).emit("player-left", socket.id);

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
            mmr: player.rating || 1000,
            color: player.color || "Red",
        }));

        const gameObj = {
            numberOfPlayers: lobbies[socket.lobbyId].numberOfPlayers,
            gameSpeed: lobbies[socket.lobbId].gameSpeed,
            ranked: lobbies[socket.lobbId].isRanked
        }

        const body = {
            players: players,
            settings: gameObj
        }

        console.log(body);
        const res = await axios.post("http://localhost:8000/games", body);
        console.log(res.data);
    })
}