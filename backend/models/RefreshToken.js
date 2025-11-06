import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  tokenId: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("RefreshToken", RefreshTokenSchema);
