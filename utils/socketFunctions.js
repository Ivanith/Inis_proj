export function getLobbyById(lobbies, targetLobbyId)
{
    const targetLobby = lobbies[targetLobbyId];
    return {
        id: targetLobbyId,
        name: targetLobby.name,
        numberOfPlayers: targetLobby.players.length,
        players: targetLobby.players,
        maxPlayers: targetLobby.maxPlayers,
        owner: targetLobby.owner,
        gameSpeed: targetLobby.gameSpeed,
        isRanked: targetLobby.isRanked,
        isPrivate: targetLobby.isPrivate,
    };
}
export function updateLobby(io, lobbies, lobbyId, socket)
{
    const lobby = getLobbyById(lobbies, lobbyId);
    io.to(socket.lobbyId).emit("lobby-updated", lobby);
}
export function getLobbyList(lobbies)
{
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
export function generateRandomLobbyId()
{
    return Math.random().toString(36).substr(2, 9);
}
export function updateLobbyList(io, lobbyList)
{
    io.emit("lobby-list", lobbyList);
}