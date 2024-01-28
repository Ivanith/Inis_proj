export interface ILobby {
    name: string,
    maxPlayers: number,
    owner: {
        SocketId: string,
        userId: string
    },
    players:
    {
        socketId: string,
        userId: string,
        userName: string,
        rating: number,
        color: string,
        winrate: number,
        isReady: boolean
    }[]
    ,
    messages: { playerName: string, message: string }[],
    gameSpeed: "medium" | "fast" | "slow",
    isRanked: boolean,
    isPrivate: boolean,
    password: string | null,
    canStartGame: boolean
}

export interface ILobbySettingsInput {
    maxPlayers: number,
    isRanked: boolean,
    gameSpeed: "medium" | "fast" | "slow"
}
export interface ILobbies {
    [lobbyId: string]: ILobby;
}
export interface ILobbyDTO {
    id: string,
    name: string,
    numberOfPlayers: number,
    maxPlayers: number,
    gameSpeed: "medium" | "fast" | "slow",
    isRanked: boolean,
    isPrivate: boolean,
}