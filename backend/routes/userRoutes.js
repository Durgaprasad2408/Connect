import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// Helper function to validate ObjectId
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Check if ID is a valid ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const user = await User.findById(id).select("-passwordHash");
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user profile
router.get("/me", async (req, res) => {
  try {
    // Check if user ID is provided in the JWT token (from auth middleware)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access token required" });
    }
    
    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    
    try {
      const payload = jwt.default.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("-passwordHash");
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (jwtError) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update current user profile
router.put("/me", async (req, res) => {
  try {
    // Check if user ID is provided in the JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access token required" });
    }
    
    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    
    try {
      const payload = jwt.default.verify(token, process.env.JWT_SECRET);
      const userId = payload.sub;
      
      const { name, email, currentPassword, newPassword, bio, profession } = req.body;
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update basic info if provided
      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (profession !== undefined) user.profession = profession;
      
      // Update email if provided and different
      if (email && email !== user.email) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({
          email: email,
          _id: { $ne: userId }
        });
        if (existingUser) {
          return res.status(400).json({ error: "Email is already taken" });
        }
        user.email = email;
      }
      
      // Update password if provided
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password is required to set new password" });
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        // Validate new password strength
        if (newPassword.length < 6) {
          return res.status(400).json({ error: "New password must be at least 6 characters long" });
        }
        
        // Hash new password
        const saltRounds = 12;
        user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
      }
      
      await user.save();
      
      // Return updated user without password
      const updatedUser = await User.findById(userId).select("-passwordHash");
      res.json(updatedUser);
      
    } catch (jwtError) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error updating current user:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update user profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, currentPassword, newPassword } = req.body;
    
    // Check if ID is provided and valid
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email,
      _id: { $ne: id }
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already taken" });
    }
    
    // Update basic info
    user.name = name;
    user.email = email;
    
    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to set new password" });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // Hash new password
      const saltRounds = 12;
      user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(id).select("-passwordHash");
    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
    
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Upload/Update profile photo
router.post("/:id/avatar", upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided and valid
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }
    
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // If user already has an avatar, delete the old one from Cloudinary
    if (user.avatarUrl) {
      try {
        const publicId = user.avatarUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
        // Continue with upload even if deletion fails
      }
    }
    
    // Upload new avatar to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });
    
    // Update user's avatar URL
    user.avatarUrl = uploadResult.secure_url;
    await user.save();
    
    res.json({
      message: "Profile photo updated successfully",
      avatarUrl: user.avatarUrl
    });
    
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: error.message || "Failed to upload profile photo" });
  }
});

// Delete profile photo
router.delete("/:id/avatar", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is provided and valid
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // If user has an avatar, delete it from Cloudinary
    if (user.avatarUrl) {
      try {
        const publicId = user.avatarUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting avatar from Cloudinary:', deleteError);
        // Continue with clearing URL even if deletion fails
      }
    }
    
    // Clear avatar URL
    user.avatarUrl = null;
    await user.save();
    
    res.json({ message: "Profile photo deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting avatar:", error);
    res.status(500).json({ error: "Failed to delete profile photo" });
  }
});

export default router;
