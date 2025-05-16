import express from "express";
import bcrypt from "bcryptjs";
import { poolPromise } from "./database.js";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./authMiddleware.js";

export default (SECRET_KEY) => {
  const router = express.Router();

  //-----------------User registration route-----------------\\
  router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    try {
      const pool = await poolPromise;
      const emailCheck = await pool
        .request()
        .input("email", email)
        .query("SELECT id FROM Users WHERE email = @email");

      if (emailCheck.recordset.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = `
        INSERT INTO Users (username, email, password_hash)
        VALUES (@username, @email, @password_hash);
      `;

      await pool
        .request()
        .input("username", username)
        .input("email", email)
        .input("password_hash", hashedPassword)
        .query(insertQuery);

      res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
      console.error("Error during user registration:", err);
      res
        .status(500)
        .json({ message: "An error occurred while registering the user." });
    }
  });

  //-----------------User login route-----------------\\
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("email", email)
        .query(
          "SELECT id, username, Password_Hash FROM Users WHERE Email = @email"
        );

      if (result.recordset.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = result.recordset[0];
      const isPasswordValid = await bcrypt.compare(
        password,
        user.Password_Hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, email: email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({ token });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ message: "An error occurred during login." });
    }
  });

  //-----------------Blog post route-----------------\\
  router.post("/posts", authenticateToken, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Missing data" });
    }

    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("Title", title)
        .input("Content", content)
        .input("UserId", req.user.userId).query(`
          INSERT INTO Posts (Title, Content, UserId)
          VALUES (@Title, @Content, @UserId)
        `);

      res.status(201).json({ message: "Post created successfully!" });
    } catch (err) {
      console.error("Error creating post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while creating the post." });
    }
  });

  //-----------------Get blog posts-----------------\\
  router.get("/posts", async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.query(`
        SELECT Posts.Id, Posts.Title, Posts.Content, Posts.CreatedAt, Users.username AS Username
        FROM Posts
        JOIN Users ON Posts.UserId = Users.Id
        ORDER BY Posts.CreatedAt DESC
      `);

      res.json(result.recordset || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      res
        .status(500)
        .json({ message: "An error occurred while fetching posts." });
    }
  });

  //-----------------Search posts-----------------\\
  router.get("/posts/search", async (req, res) => {
    const { q } = req.query;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("query", `%${q || ""}%`).query(`
          SELECT Id, Title, Content, CreatedAt
          FROM Posts
          WHERE Title LIKE @query
          ORDER BY CreatedAt DESC
        `);
      res.json(result.recordset || []);
    } catch (err) {
      console.error("Error searching posts:", err);
      res
        .status(500)
        .json({ message: "An error occurred while searching posts." });
    }
  });

  //-----------------Get specific post-----------------\\
  router.get("/posts/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
      const pool = await poolPromise;
      const result = await pool.request().input("PostId", postId).query(`
        SELECT Id, Title, Content, UserId, CreatedAt
        FROM Posts
        WHERE Id = @PostId
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(result.recordset[0]);
    } catch (err) {
      console.error("Error fetching post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the post." });
    }
  });

  //-----------------Update specific post-----------------\\
  router.put("/posts/:postId", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    try {
      const pool = await poolPromise;
      const check = await pool
        .request()
        .input("PostId", postId)
        .query("SELECT UserId FROM Posts WHERE Id = @PostId");

      if (!check.recordset.length || check.recordset[0].UserId !== userId) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this post." });
      }

      await pool
        .request()
        .input("PostId", postId)
        .input("Title", title)
        .input("Content", content)
        .query(
          "UPDATE Posts SET Title = @Title, Content = @Content WHERE Id = @PostId"
        );

      res.json({ message: "Post updated successfully!" });
    } catch (err) {
      console.error("Error updating post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while updating the post." });
    }
  });

  //-----------------Delete specific post-----------------\\
  router.delete("/posts/:postId", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    try {
      const pool = await poolPromise;
      const check = await pool
        .request()
        .input("PostId", postId)
        .query("SELECT UserId FROM Posts WHERE Id = @PostId");

      if (!check.recordset.length || check.recordset[0].UserId !== userId) {
        return res
          .status(403)
          .json({ message: "You are not allowed to delete this post." });
      }

      // Delete the post
      await pool
        .request()
        .input("PostId", postId)
        .query("DELETE FROM Posts WHERE Id = @PostId");

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
      const pool = await poolPromise;
      const check = await pool
        .request()
        .input("UserId", userId)
        .input("PostId", postId)
        .query(
          "SELECT Id FROM Likes WHERE UserId = @UserId AND PostId = @PostId"
        );

      if (check.recordset.length > 0) {
        return res.status(400).json({ message: "Already liked" });
      }

      await pool
        .request()
        .input("UserId", userId)
        .input("PostId", postId)
        .query(
          "INSERT INTO Likes (UserId, PostId, LikedAt) VALUES (@UserId, @PostId, GETDATE())"
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
      const pool = await poolPromise;
      await pool
        .request()
        .input("UserId", userId)
        .input("PostId", postId)
        .query("DELETE FROM Likes WHERE UserId = @UserId AND PostId = @PostId");

      res.json({ message: "Post unliked!" });
    } catch (err) {
      console.error("Error unliking post:", err);
      res
        .status(500)
        .json({ message: "An error occurred while unliking the post." });
    }
  });

  //-----------------Get like count and whether the user liked the post-----------------\\
  router.get("/posts/:postId/like", authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;

    try {
      const pool = await poolPromise;
      const countResult = await pool
        .request()
        .input("PostId", postId)
        .query(
          "SELECT COUNT(*) AS likeCount FROM Likes WHERE PostId = @PostId"
        );

      const userLikeResult = await pool
        .request()
        .input("UserId", userId)
        .input("PostId", postId)
        .query(
          "SELECT Id FROM Likes WHERE UserId = @UserId AND PostId = @PostId"
        );

      res.json({
        likeCount: countResult.recordset[0].likeCount,
        likedByUser: userLikeResult.recordset.length > 0,
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
