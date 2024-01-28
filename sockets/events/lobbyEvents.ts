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
            maxPlayers: 3,
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
            canStartGame: false
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
            userId: socket.user?.id || socket.id,
            userName: socket.user?.userName || "unloggedUser",
            rating: socket.user?.rating || 100,
            color: socket.user?.preferedColor || "red",
            winrate: socket.user?.winrate || 0,
            isReady: false,
        };
        lobbies[lobbyId].players.push(playerInfo);
        socket.join(lobbyId);
        socket.lobbyId = lobbyId;
        socket.emit("lobby-joined", true);
        updateLobbyList(io, getLobbyList(lobbies));
        updateLobby(io, lobbies, lobbyId, socket);
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
        updateLobbyList(io, getLobbyList(lobbies));
        updateLobby(io, lobbies, socket.lobbyId, socket);
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
        const everyPlayerIsReady = lobbies[lobbyId].players.every((player) => player.isReady);
        if (everyPlayerIsReady) {
            lobbies[lobbyId].canStartGame = true;
        } else {
            lobbies[lobbyId].canStartGame = false;
        }
        updateLobby(io, lobbies, lobbyId, socket);
    });

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
            console.log("auth error");
            return;
        }
        if (!socket.lobbyId) {
            console.log("lobby id error");
            return;
        }
        if (!lobbies.hasOwnProperty(socket.lobbyId)) {
            console.log("no lobby id");
            return;
        }
        if (!lobbies[socket.lobbyId].players.find((player) => player.socketId === socket.id)) {
            console.log("player is not in lobby");
            return;
        }
        if (lobbies[socket.lobbyId].owner.SocketId !== socket.id) {
            console.log("player is not owner");
            return;
        }
        if (lobbies[socket.lobbyId].maxPlayers !== lobbies[socket.lobbyId].players.length) {
            console.log("not enough players");
            return;
        }
        if (!lobbies[socket.lobbyId].players.every((player) => player.isReady)) {
            console.log("not all players are ready");
            return;
        }
        console.log("reached validation")
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
        try {
            const res = await axios.post<{ gameId: string }>("http://localhost:8000/games", body);
            console.log(res.data);
            io.to(socket.lobbyId!).emit("start-game", res.data);
            delete lobbies[lobbyId];
        } catch (err: any) {
            console.log(err)
        }
    })
}