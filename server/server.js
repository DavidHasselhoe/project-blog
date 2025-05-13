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

app.use(express.static(path.join(__dirname, "../public"), { index: false }));

app.get("/", (req, res) => {
  res.redirect("/register");
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "register.html"));
});

// Register all routes from routes.js under /api
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
