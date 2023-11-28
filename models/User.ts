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
    },
    wins: {
      type: Number,
    },
    winrate: {
      type: Number,
    },
    rating: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
