import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatarUrl: String,
  bio: String,
  profession: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);

