import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "./database.js"; // PostgreSQL pool
import jwt from "jsonwebtoken";
import { authenticateToken } from "./authMiddleware.js"; // Middleware for JWT authentication

export default (SECRET_KEY) => {
  const router = express.Router();

  //-----------------Register route-----------------\\
  router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    try {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)",
        [username, email, hashedPassword]
      );

      res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
      console.error("Error during user registration:", err);
      res
        .status(500)
        .json({ message: "An error occurred while registering the user." });
    }
  });

  //-----------------Login route-----------------\\
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        "SELECT id, username, password_hash FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({ token });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ message: "An error occurred during login." });
    }
  });

  //-----------------Create a blog post-----------------\\
  router.post("/posts", authenticateToken, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Missing data" });
    }

    try {
      await pool.query(
        "INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3)",
        [title, content, req.user.userId]
      );

      res.status(201).json({ message: "Post created successfully!" });
    } catch (err) {
      console.error("Error creating post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while creating the post." });
    }
  });

  //-----------------Get all blog posts-----------------\\
  router.get("/posts", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT posts.id, posts.title, posts.content, posts.created_at, users.username AS username " +
        "FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC"
      );

      res.json(result.rows || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      res
        .status(500)
        .json({ message: "An error occurred while fetching posts." });
    }
  });

  //-----------------Get a specific post-----------------\\
  router.get("/posts/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
      const result = await pool.query(
        "SELECT id, title, content, user_id, created_at FROM posts WHERE id = $1",
        [postId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the post." });
    }
  });

  //-----------------Update a specific post-----------------\\
  router.put("/posts/:postId", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    try {
      const check = await pool.query(
        "SELECT user_id FROM posts WHERE id = $1",
        [postId]
      );

      if (!check.rows.length || check.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this post." });
      }

      await pool.query(
        "UPDATE posts SET title = $1, content = $2 WHERE id = $3",
        [title, content, postId]
      );

      res.json({ message: "Post updated successfully!" });
    } catch (err) {
      console.error("Error updating post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while updating the post." });
    }
  });

  //-----------------Delete a specific post-----------------\\
  router.delete("/posts/:postId", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    try {
      const check = await pool.query(
        "SELECT user_id FROM posts WHERE id = $1",
        [postId]
      );

      if (!check.rows.length || check.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "You are not allowed to delete this post." });
      }

      await pool.query("DELETE FROM posts WHERE id = $1", [postId]);

      res.json({ message: "Post deleted successfully!" });
    } catch (err) {
      console.error("Error deleting post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while deleting the post." });
    }
  });

  //-----------------Like a post-----------------\\
  router.post("/posts/:postId/like", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    try {
      const check = await pool.query(
        "SELECT id FROM likes WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      if (check.rows.length > 0) {
        return res.status(400).json({ message: "Already liked" });
      }

      await pool.query(
        "INSERT INTO likes (user_id, post_id, liked_at) VALUES ($1, $2, NOW())",
        [userId, postId]
      );

      res.json({ message: "Post liked!" });
    } catch (err) {
      console.error("Error liking post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while liking the post." });
    }
  });

  //-----------------Unlike a post-----------------\\
  router.delete("/posts/:postId/like", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    try {
      await pool.query(
        "DELETE FROM likes WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      res.json({ message: "Post unliked!" });
    } catch (err) {
      console.error("Error unliking post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while unliking the post." });
    }
  });

  //-----------------Get like info-----------------\\
  router.get("/posts/:postId/like", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    try {
      const countResult = await pool.query(
        "SELECT COUNT(*) AS like_count FROM likes WHERE post_id = $1",
        [postId]
      );

      const userLikeResult = await pool.query(
        "SELECT id FROM likes WHERE user_id = $1 AND post_id = $2",
        [userId, postId]
      );

      res.json({
        likeCount: parseInt(countResult.rows[0].like_count),
        likedByUser: userLikeResult.rows.length > 0,
      });
    } catch (err) {
      console.error("Error fetching like info:", err);
      res
        .status(500)
        .json({ message: "An error occurred while fetching like info." });
    }
  });

  return router;
};
