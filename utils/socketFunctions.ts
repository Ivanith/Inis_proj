import { Socket, Server } from "socket.io";
import { ILobbies, ILobby, ILobbyDTO } from "../interfaces/ILobbies";
import { ICustomSocket } from "../sockets/events/lobbyEvents";

export function getLobbyById(lobbies: ILobbies, targetLobbyId: string): ILobby {
    const targetLobby = lobbies[targetLobbyId];
    return targetLobby;
}
export function updateLobby(io: Server, lobbies: ILobbies, lobbyId: string, socket: ICustomSocket) {
    const lobby = getLobbyById(lobbies, lobbyId);
    io.to(lobbyId).emit("lobby-updated", lobby);
}
export function getLobbyList(lobbies: ILobbies): ILobbyDTO[] {
    return Object.entries(lobbies).map(([lobby_Id, lobby]) =>
    (
        {
            id: lobby_Id,
            name: lobby.name,
            numberOfPlayers: lobby.players.length,
            maxPlayers: lobby.maxPlayers,
            gameSpeed: lobby.gameSpeed,
            isRanked: lobby.isRanked,
            isPrivate: lobby.isPrivate,
        }));
}
export function generateRandomLobbyId() {
    return Math.random().toString(36).substr(2, 9);
}
export function updateLobbyList(io: Server, lobbyList: ILobbyDTO[]) {
    io.emit("lobby-list", lobbyList);
}