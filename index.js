import express, { json } from "express";

import multer from "multer";

import cors from "cors";

import mongoose from "mongoose";

import { registerValidation, loginValidation } from "./validations.js";

import { handleValidationErrors, checkAuth } from "./middleware/index.js";

import { ChatController, GameController, MessageController, UserController } from "./controllers/index.js";

import http from "http";

import { Server, Socket } from "socket.io"

import handleSocketConnections from "./sockets/sockets.js"

//default

const app = express();

const server = http.createServer(app);



const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:4444",
  },
});

app.use(express.json());

handleSocketConnections(io);

app.use(cors({
  origin: 'http://localhost:4444'
}));


mongoose
  .connect(
    "mongodb+srv://admin:qwerty123@cluster0.hsgvn1r.mongodb.net/Inis_proj?retryWrites=true&w=majority"
  )
  .then(() => console.log("DB ok"))
  .catch((err) => console.log("DB error", err));


// multer part
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
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

//Api for Users
app.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  UserController.login
);

app.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  UserController.register
);

app.post("/users/add/:id", checkAuth, UserController.addFriend);

app.delete("/users/add/:id", checkAuth, UserController.removeFriend);

app.get("/users/me", checkAuth, UserController.getMe);

app.get("/users/:id", checkAuth, UserController.getOneUser);

app.get("/users/search/:name", checkAuth, UserController.searchUserByName);

app.get("/leaderboard", checkAuth, UserController.getUsers);

app.patch("/users/me", checkAuth, UserController.updateMe);

app.patch("/users/me/stat", checkAuth, UserController.updateStat);

app.patch("/users/me/pass", checkAuth, UserController.updatePass);

//Api for Games

app.post("/game/create", checkAuth, GameController.create);

//Api for Chats 

app.post("/chat", checkAuth, ChatController.accessChat);

app.get("/chat", checkAuth, ChatController.fetchChats);

//Api for Messages

app.get("/message/:chatId",checkAuth, MessageController.allMessages);

app.post("/message", checkAuth, MessageController.sendMessage);


// server check
const PORT = 4444;
server.listen(PORT, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log(`Server is running on port ${PORT}`);
});
