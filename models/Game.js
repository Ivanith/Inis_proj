import mongoose from "mongoose";
const GameSchema = new mongoose.Schema(
  {
    duration: {
      type: Number,
      required: true,
    },
    rounds: {
      type: Number,
      required: true,
    },
    numberOfPlayers: {
      type: Number,
      required: true,
    },
    players: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      required: true,
    },
    gameSpeed: {
      type: String,
      required: true,
    },
    ranked: {
      type: Boolean,
      required: true,
    },
    result: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Game", GameSchema);
