require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reflectionRoutes = require("./routes/reflectionRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ENV CHECK 

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in backend/.env");
  process.exit(1);
}

// MIDDLEWARE

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true }));

// API HEALTH 

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudyTrack API is running"
  });
});

// API ROUTES 

app.use("/api/auth", authRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/reflections", reflectionRoutes);

// FRONTEND 

const frontendPath = path.join(__dirname, "../frontend");

console.log("Frontend path:", frontendPath);

// Serve CSS, JS, HTML, etc.
app.use(express.static(frontendPath));

// Explicit frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "register.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

app.get("/goals.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "goals.html"));
});

app.get("/profile.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "profile.html"));
});

// 404 API

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      message: "API route not found"
    });
  }

  next();
});

// ERROR HANDLER 

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    message: "Something went wrong on the server"
  });
});

// START SERVER

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`StudyTrack server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
