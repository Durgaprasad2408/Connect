// routes/posts.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../utils/cloudinary.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import Post from "../models/Post.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 4
  }
});
const router = express.Router();

/**
 * Helper: normalize ID to string
 */
const idStr = (v) => (v ? v.toString() : v);

/**
 * Create post
 */
router.post("/", requireAuth, upload.array("media", 4), async (req, res) => {
  try {
    const { text } = req.body;
    const media = [];

    // Handle file uploads to Cloudinary
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                resource_type: "auto",
                folder: "connect-app",
                quality: "auto:good",
                fetch_format: "auto"
              },
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          media.push({ url: result.secure_url, type: result.resource_type });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).json({ error: "Failed to upload media", details: uploadError.message });
        }
      }
    }

    const postData = { author: req.user.id, text };
    if (media.length) postData.media = media;

    const post = await Post.create(postData);

    // Emit socket event with populated author and normalized likes/comments
    const io = req.app.get('io');
    if (io) {
      const populatedPost = await Post.findById(post._id)
        .populate("author", "name _id avatarUrl")
        .populate("comments.author", "name _id avatarUrl");
      const payload = {
        ...populatedPost.toObject(),
        _id: idStr(populatedPost._id),
        likes: (populatedPost.likes || []).map(idStr),
        comments: (populatedPost.comments || []).map(c => ({
          ...c.toObject(),
          _id: idStr(c._id),
          author: c.author ? { _id: idStr(c.author._id), name: c.author.name } : c.author
        }))
      };
      io.emit('newPost', payload);
    }

    // Return created post (populated minimal author)
    const responsePost = await Post.findById(post._id).populate("author", "name _id avatarUrl");
    res.json({ post: { ...responsePost.toObject(), likes: (responsePost.likes || []).map(idStr) } });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post", details: err.message });
  }
});

/**
 * Like / Unlike post (fixed: correct ID comparison + atomic update + normalized response)
 */
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Load post
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userIdStr = idStr(userId);
    const alreadyLiked = (post.likes || []).some(likeId => idStr(likeId) === userIdStr);

    // Use atomic update
    let updated;
    if (alreadyLiked) {
      // Unlike
      updated = await Post.findByIdAndUpdate(
        post._id,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // Like
      updated = await Post.findByIdAndUpdate(
        post._id,
        { $addToSet: { likes: userId } },
        { new: true }
      );
    }

    if (!updated) return res.status(500).json({ error: "Failed to update likes" });

    // Normalize likes to strings before returning / emitting
    const normalizedLikes = (updated.likes || []).map(idStr);

    // Emit socket event with postId and normalized likes
    const io = req.app.get('io');
    if (io) {
      io.emit('postLiked', { postId: idStr(updated._id), likes: normalizedLikes });
    }

    // Return normalized likes
    res.json({ likes: normalizedLikes });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ error: "Failed to like post", details: err.message });
  }
});

/**
 * Add comment
 */
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ error: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = {
      author: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate comment author
    await post.populate('comments.author', 'name _id avatarUrl');
    const newComment = post.comments[post.comments.length - 1];
    const normalizedComment = {
      ...newComment.toObject(),
      _id: idStr(newComment._id),
      author: newComment.author ? { _id: idStr(newComment.author._id), name: newComment.author.name, avatarUrl: newComment.author.avatarUrl } : newComment.author
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('commentAdded', { postId: req.params.id, comment: normalizedComment });
    }

    res.json({ comment: normalizedComment });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment", details: err.message });
  }
});

/**
 * Delete comment
 */
router.delete("/:postId/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (idStr(comment.author) !== idStr(req.user.id) && idStr(post.author) !== idStr(req.user.id)) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await post.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('commentDeleted', { postId: req.params.postId, commentId: req.params.commentId });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete comment", details: err.message });
  }
});

/**
 * Feed
 */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name _id avatarUrl")
      .populate("comments.author", "name _id avatarUrl")
      .sort({ createdAt: -1 });

    // Sort comments in reverse chronological order (newest first) for each post
    posts.forEach(post => {
      if (post.comments && post.comments.length > 0) {
        post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    });

    // Normalize all IDs before sending
    const normalized = posts.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        _id: idStr(obj._id),
        author: obj.author ? { _id: idStr(obj.author._id), name: obj.author.name, avatarUrl: obj.author.avatarUrl } : obj.author,
        likes: (obj.likes || []).map(idStr),
        comments: (obj.comments || []).map(c => ({
          ...c,
          _id: idStr(c._id),
          author: c.author ? { _id: idStr(c.author._id), name: c.author.name, avatarUrl: c.author.avatarUrl } : c.author
        }))
      };
    });

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ error: "Failed to fetch posts", details: err.message });
  }
});

/**
 * Get single post by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name _id avatarUrl")
      .populate("comments.author", "name _id avatarUrl");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Sort comments in reverse chronological order (newest first)
    if (post.comments && post.comments.length > 0) {
      post.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Normalize all IDs before sending
    const normalized = {
      ...post.toObject(),
      _id: idStr(post._id),
      author: post.author ? {
        _id: idStr(post.author._id),
        name: post.author.name,
        avatarUrl: post.author.avatarUrl
      } : post.author,
      likes: (post.likes || []).map(idStr),
      comments: (post.comments || []).map(c => ({
        ...c.toObject(),
        _id: idStr(c._id),
        author: c.author ? {
          _id: idStr(c.author._id),
          name: c.author.name,
          avatarUrl: c.author.avatarUrl
        } : c.author
      }))
    };

    res.json(normalized);
  } catch (err) {
    console.error("Error fetching single post:", err);
    res.status(500).json({ error: "Failed to fetch post", details: err.message });
  }
});

/**
 * Edit post
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ error: "Post text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (idStr(post.author) !== idStr(req.user.id)) {
      return res.status(403).json({ error: "Not authorized to edit this post" });
    }

    post.text = text.trim();
    await post.save();

    // Populate author for response
    await post.populate("author", "name _id avatarUrl");
    
    const updatedPost = {
      ...post.toObject(),
      _id: idStr(post._id),
      author: post.author ? { _id: idStr(post.author._id), name: post.author.name, avatarUrl: post.author.avatarUrl } : post.author,
      likes: (post.likes || []).map(idStr)
    };

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('postUpdated', {
        postId: req.params.id,
        text: text.trim(),
        updatedAt: post.updatedAt
      });
    }

    res.json({ post: updatedPost });
  } catch (err) {
    console.error("Error editing post:", err);
    res.status(500).json({ error: "Failed to edit post", details: err.message });
  }
});

/**
 * Delete post
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (idStr(post.author) !== idStr(req.user.id)) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('postDeleted', { postId: req.params.id });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Failed to delete post", details: err.message });
  }
});

export default router;
