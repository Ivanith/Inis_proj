import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      default: "User",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    friends: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    preferedColor: {
      type: String,
      default: "blue"
    },
    units: {
      type: String,
      default: ""
    },
    preferences: {
      type: String,
      default: ""
    },
    totalGames: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    winrate: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 100,
    },
    banStatus: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
