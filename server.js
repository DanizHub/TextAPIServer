const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MAX_MESSAGES = 30;
const SEND_PASSWORD = "42";     // Password for sending messages
const CLEAR_PASSWORD = "0207";  // Separate password for clearing messages

const messages = [];

// Function to add a message and keep only the latest MAX_MESSAGES
function addMessage(type, value) {
  messages.push({ type, value });
  if (messages.length > MAX_MESSAGES) {
    messages.shift(); // Remove oldest
  }
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Handle sending text
app.post("/messages", (req, res) => {
  const { text, password } = req.body;

  if (password !== SEND_PASSWORD) {
    return res.status(403).json({ error: "Invalid password" });
  }

  if (typeof text !== "string" || text.length > 200) {
    return res.status(400).json({ error: "Invalid message" });
  }

  addMessage("text", text);
  res.json({ status: "ok" });
});

// Handle uploading image
app.post("/upload", upload.single("image"), (req, res) => {
  const password = req.body.password;

  if (password !== SEND_PASSWORD) {
    return res.status(403).json({ error: "Invalid password" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  addMessage("image", imageUrl);
  res.json({ status: "ok", url: imageUrl });
});

// Handle clearing all messages
app.post("/clear", (req, res) => {
  const { password } = req.body;

  if (password !== CLEAR_PASSWORD) {
    return res.status(403).json({ error: "Invalid clear password" });
  }

  messages.length = 0; // Clear array
  res.json({ status: "cleared" });
});

// Get all messages
app.get("/messages", (req, res) => {
  res.json(messages);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
