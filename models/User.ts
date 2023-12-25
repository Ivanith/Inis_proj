import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
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
    },
    preferedColor: {
      type: String,
    },
    units: {
      type: String,
    },
    preferences: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
