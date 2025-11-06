import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash: hash });
    res.json({ message: "User registered", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const tokenId = crypto.randomBytes(16).toString("hex");
    const refreshToken = createRefreshToken(user, tokenId);
    const accessToken = createAccessToken(user);
    await RefreshToken.create({ tokenId, user: user._id });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, avatarUrl: user.avatarUrl }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "No refresh token provided" });
    
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    
    // Validate that payload.sub is a valid ObjectId
    if (!payload.sub || !mongoose.Types.ObjectId.isValid(payload.sub)) {
      return res.status(401).json({ error: "Invalid token payload" });
    }
    
    const tokenExists = await RefreshToken.findOne({ tokenId: payload.tid, user: payload.sub });
    if (!tokenExists) return res.status(401).json({ error: "Token revoked" });

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    
    const newAccessToken = createAccessToken(user);
    
    // Optionally generate a new refresh token for rotation
    const newTokenId = crypto.randomBytes(16).toString("hex");
    const newRefreshToken = createRefreshToken(user, newTokenId);
    
    // Replace old refresh token with new one
    await RefreshToken.deleteOne({ tokenId: payload.tid });
    await RefreshToken.create({ tokenId: newTokenId, user: user._id });
    
    res.json({
      accessToken: newAccessToken,
      newRefreshToken,
      user: { id: user._id, name: user.name, avatarUrl: user.avatarUrl }
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      await RefreshToken.deleteMany({ tokenId: payload.tid });
    }
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({ message: "Logged out" });
  }
});

export default router;
