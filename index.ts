import express, { NextFunction, json } from "express";
import multer from "multer";
import cors from "cors";
import mongoose from "mongoose";
import { registerValidation, loginValidation } from "./validations";
import { handleValidationErrors, checkAuth } from "./middleware/index";
import { ChatController, GameController, MessageController, UserController } from "./controllers/index";
import http from "http";
import { Server, Socket } from "socket.io"
import handleSocketConnections from "./sockets/sockets"
import userRoutes from "./routes/userRoutes"
//default
import path from "path"
import url from 'url';
//@ts-ignore
// const __filename = url.fileURLToPath(import.meta.url);
//@ts-ignore
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const app = express();

const server = http.createServer(app);



const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: ["http://localhost:8000", "http://localhost:3000"],
  },
});

app.use(express.json());

handleSocketConnections(io);



app.use(cors({
  origin: ['http://localhost:8000', "http://localhost:3000"]
}));


mongoose
  .connect(
    "mongodb+srv://admin:qwerty123@cluster0.hsgvn1r.mongodb.net/Inis_proj?retryWrites=true&w=majority"
  )
  .then(() => console.log("DB ok"))
  .catch((err) => console.log("DB error", err));


// multer part
const storage = multer.diskStorage({
  // @ts-ignore
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
  // @ts-ignore
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

//multer route

app.post("/upload", checkAuth, upload.single("image"), (req, res) => {
  res.json({
    url: "/uploads/${req.file.originalname}",
  });
});

app.use("/", userRoutes);

//Api for Games

app.post("/game/create", GameController.create);

app.use("/game/:gameId", express.static(path.resolve(__dirname, 'client/front_game/build')));
app.get('/game/:gameId', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/front_game/build', 'index.html'));
});

app.use("/", express.static(path.resolve(__dirname, 'client/front_serivce/build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/front_serivce/build', 'index.html'));
});

//Api for Chats 

app.post("/chat", checkAuth, ChatController.accessChat);

app.get("/chat", checkAuth, ChatController.fetchChats);

//Api for Messages

app.get("/message/:chatId", checkAuth, MessageController.allMessages);

app.post("/message", checkAuth, MessageController.sendMessage);


// server check
const PORT = 4444;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
