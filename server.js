const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const downloadRoute = require("./routes/download");
const audioRoute = require("./routes/audioToText");

const app = express();

app.use(cors());
app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "SnapFetch API",
    version: "2.0.0"
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/download", downloadRoute);
app.use("/audio-to-text", audioRoute);

// Static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 SnapFetch API Started");
  console.log(`📌 Port : ${PORT}`);
  console.log(
    `🔑 Groq : ${
      process.env.GROQ_API_KEY ? "Loaded ✅" : "Missing ❌"
    }`
  );
  console.log("==================================");
});