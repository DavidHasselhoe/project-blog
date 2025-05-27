import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import routes from "./routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"));
});

app.use("/api", routes(process.env.JWT_SECRET));

app.listen(PORT, () => {
  console.log(`
Application: http://localhost:${PORT}/index.html
Database Admin: http://localhost:8080
  `);
});
