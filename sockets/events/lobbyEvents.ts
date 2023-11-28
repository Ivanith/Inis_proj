import { generateRandomLobbyId } from "../../utils/socketFunctions";
import { getLobbyList } from "../../utils/socketFunctions";
import { getLobbyById } from "../../utils/socketFunctions";
import { updateLobbyList } from "../../utils/socketFunctions";
import { lobbies } from "../../utils/lobbies";
import { updateLobby } from "../../utils/socketFunctions";
import { Server, Socket } from "socket.io";
import { extname } from "path";
import axios from "axios";
import { ILobby, ILobbySettingsInput } from "../../interfaces/ILobbies";
export interface ICustomSocket extends Socket {
    auth?: boolean,
    user?: any,
    lobbyId?: string
}
export function handleLobbyEvents(io: Server, socket: ICustomSocket) {
    socket.on("create-lobby", async ({ lobbyName, isPrivate, password }: { lobbyName: string, isPrivate: boolean, password: string }) => {
        if (!socket.auth) {
            return;
        }
        const lobbyId = generateRandomLobbyId();
        lobbies[lobbyId] = {
            name: lobbyName,
            maxPlayers: 4,
            owner: {
                SocketId: socket.id,
                userId: socket.user.id
            },
            players: [
                {
                    socketId: socket.id,
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
    socket.on("lobby-info", () => {
        if (!socket.lobbyId) {
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            socket.emit("error", { message: "You are not in this lobby" });
            return;
        }
        updateLobby(io, lobbies, socket.lobbyId, socket);
    })
    socket.on("join-lobby", ({ lobbyId, password }) => {
        if (!lobbies[lobbyId]) {
            socket.emit("lobby-joined", false);
            return;
        }
        if (lobbies[lobbyId].players.length >= lobbies[lobbyId].maxPlayers) {
            socket.emit("lobby-joined", false);
            return;
        }
        if (lobbies[lobbyId].isPrivate === true && lobbies[lobbyId].password !== password) {
            socket.emit("lobby-joined", false);
            return;
        }
        if (lobbies[lobbyId].players.find((player) => player.socketId === socket.id)) {
            socket.emit("lobby-joined", false);
            return;
        }
        const playerInfo = {
            socketId: socket.id,
            userId: socket.user.id,
            userName: socket.user.userName,
            rating: socket.user.rating,
            color: socket.user.preferedColor,
            winrate: socket.user.winrate,
            isReady: false,
        };
        lobbies[lobbyId].players.push(playerInfo);
        socket.join(lobbyId);
        socket.lobbyId = lobbyId;
        socket.emit("lobby-joined", true);
        updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("send-message", ({ message }) => {
        if (!socket.auth) {
            return;
        }
        if (!socket.lobbyId) {
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            socket.emit("error", { message: "You are not in this lobby" });
            return;
        }
        const playerName = socket.user ? socket.user.userName : socket.id;
        const messageObject: { playerName: string, message: string } = { playerName, message };
        lobbies[socket.lobbyId].messages.push(messageObject);
        io.to(socket.lobbyId).emit("new-message", messageObject);
    });

    socket.on("request-lobby-list", () => {
        updateLobbyList(io, getLobbyList(lobbies));
    });

    socket.on("update-lobby-settings", (lobbySetting: ILobbySettingsInput) => {
        if (!socket.auth) {
            return;
        }
        if (!socket.lobbyId) {
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            return;
        }
        if (lobbies[socket.lobbyId].owner.SocketId !== socket.id) {
            return;
        }
        lobbies[socket.lobbyId].isRanked = lobbySetting.isRanked;
        lobbies[socket.lobbyId].gameSpeed = lobbySetting.gameSpeed;
        lobbies[socket.lobbyId].maxPlayers = lobbySetting.maxPlayers;
    })

    socket.on("is-ready", () => {
        if (!socket.auth) {
            return;
        }
        if (!socket.lobbyId) {
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            return;
        }
        const lobbyId = socket.lobbyId;
        const player = lobbies[lobbyId].players.find((player) => player.socketId === socket.id)!;
        player.isReady = !player.isReady;
        io.to(lobbyId).emit("player-status", { playerId: socket.id, isReady: player.isReady });

        const everyPlayerIsReady = lobbies[lobbyId].players.every((player) => player.isReady);
        if (everyPlayerIsReady) {
            io.to(lobbyId).emit("lobby-ready", lobbies[lobbyId]);
        }
        updateLobby(io, lobbies, lobbyId, socket);
    });

    // socket.on("set-RankedOption", ({ }) =>
    // {
    //     if (!socket.auth)
    //     {
    //         return;
    //     }
    //     if (!socket.lobbyId)
    //     {
    //         return;
    //     }
    //     if (!lobbies.hasOwnProperty(socket.lobbyId))
    //     {
    //         return;
    //     }
    //     if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
    //     {
    //         socket.emit("error", { message: "You are not in this lobby" });
    //         return;
    //     }
    //     if (lobbies[socket.lobbyId].owner.id !== socket.id)
    //     {
    //         return;
    //     }
    //     const lobbyId = socket.lobbyId;
    //     const isRanked = lobbies[lobbyId].isRanked;
    //     lobbies[lobbyId].isRanked = !isRanked; // Toggle isRanked status
    //     io.to(lobbyId).emit("isRankedOptionModified", { lobbyId, isRanked: lobbies[lobbyId].isRanked });
    //     updateLobby(io, lobbies, lobbyId, socket);
    // });

    // socket.on("set-GameSpeed", ({ gameSpeed }) =>
    // {
    //     if (!socket.auth)
    //     {
    //         return;
    //     }
    //     if (!lobbies[socket.lobbyId])
    //     {
    //         return;
    //     }
    //     if (!lobbies[socket.lobbyId].players.find((player) => player.id === socket.id))
    //     {
    //         socket.emit("error", { message: "You are not in this lobby" });
    //         return;
    //     }
    //     if (lobbies[socket.lobbyId].owner.id !== socket.id)
    //     {
    //         return;
    //     }
    //     if (!gameSpeedOptions.includes(gameSpeed))
    //     {
    //         return;
    //     }
    //     const lobbyId = socket.lobbyId;
    //     lobbies[lobbyId].gameSpeed = gameSpeed;
    //     io.to(lobbyId).emit("gameSpeedSettingModified", { lobbyId, gameSpeed });
    //     updateLobby(io, lobbies, lobbyId, socket);
    // }
    // );

    socket.on("lobbyDisconnect", () => {
        if (!socket.auth) {
            return;
        }
        if (!socket.lobbyId) {
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            socket.emit("error", { message: "You are not in this lobby" });
            return;
        }
        const lobbyId = socket.lobbyId;
        lobbies[lobbyId].players = lobbies[lobbyId].players.filter((player) => player.socketId !== socket.id);

        if (lobbies[lobbyId].owner.SocketId === socket.id) {
            delete lobbies[lobbyId];
        }
        io.to(lobbyId).emit("player-left", socket.id);

        updateLobby(io, lobbies, lobbyId, socket);
    });
    socket.on("start-game", async () => {
        if (!socket.auth) {
            return;
        }
        if (!socket.lobbyId) {
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            socket.emit("error", { message: "You are not in this lobby" });
            return;
        }
        if (lobbies[socket.lobbyId].owner.SocketId !== socket.id) {
            return;
        }
        if (lobbies[socket.lobbyId].maxPlayers !== lobbies[socket.lobbyId].players.length) {
            return;
        }
        if (!lobbies[socket.lobbyId].players.every((player) => player.isReady)) {
            return;
        }

        const lobbyId = socket.lobbyId;

        const players = lobbies[lobbyId].players.map((player) => ({
            id: player.userId,
            username: player.userName,
            mmr: player.rating || 1000,
            color: player.color || "Red",
        }));

        const gameObj = {
            numberOfPlayers: lobbies[socket.lobbyId].maxPlayers,
            gameSpeed: lobbies[socket.lobbyId].gameSpeed,
            ranked: lobbies[socket.lobbyId].isRanked
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