declare namespace Express {
    export interface Request {
        userId?: string;
        content: string;
        chatId: string;
        params: {
            chatId: string;
            id: string;
            name: string;
        };
    }
}