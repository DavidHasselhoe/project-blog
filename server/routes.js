import express from "express";
import bcrypt from "bcryptjs";
import { poolPromise } from "./database.js";

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

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", email)
      .query("SELECT id, password_hash FROM Users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.recordset[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.redirect("/index.html");
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "An error occurred while logging in." });
  }
});

//-----------------Blog post route-----------------\\
router.post("/posts", async (req, res) => {
  const { title, content, userId } = req.body;

  if (!title || !content || !userId) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Title", title)
      .input("Content", content)
      .input("UserId", userId).query(`
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
      SELECT Id, Title, Content, CreatedAt FROM Posts ORDER BY CreatedAt DESC
    `);

    res.json(result.recordset || []);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res
      .status(500)
      .json({ message: "An error occurred while fetching posts." });
  }
});

export default router;
