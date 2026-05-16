import express from "express";
import mongoose from "mongoose";
import "./utils/loadEnv.js";
import examRoutes from "./routes/examRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

const app = express();
app.use(express.json({ limit: "5mb" }));

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// MongoDB connect
mongoose
  .connect("mongodb://localhost:27017/edtech_db")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/api", examRoutes);
app.use("/api/v1", studentRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
