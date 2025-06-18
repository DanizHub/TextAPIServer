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
const messages = [];

// פונקציה להוספת הודעה עם הגבלת כמות
function addMessage(type, value) {
  messages.push({ type, value });
  if (messages.length > MAX_MESSAGES) {
    messages.shift(); // מוחק את ההודעה הכי ישנה
  }
}

// אחסון קבצים
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

app.post("/messages", (req, res) => {
  const text = req.body.text;
  if (typeof text !== "string" || text.length > 200) {
    return res.status(400).json({ error: "Invalid message" });
  }
  addMessage("text", text);
  res.json({ status: "ok" });
});

app.post("/upload", upload.single("image"), (req, res) => {
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  addMessage("image", imageUrl);
  res.json({ status: "ok", url: imageUrl });
});

app.get("/messages", (req, res) => {
  res.json(messages);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
