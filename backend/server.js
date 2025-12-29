require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

/* ---------- Middleware ---------- */
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- Ensure uploads folder exists ---------- */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ---------- MongoDB Connection ---------- */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

/* ---------- Multer Config ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

/* ---------- User Schema ---------- */
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,
    lostCount: { type: Number, default: 0 },
    foundCount: { type: Number, default: 0 },
    returnedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/* ---------- Item Schema ---------- */
const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["lost", "found"], required: true },
    productName: String,
    description: String,
    date: String,
    location: String,
    mobile: String,
    image: String,
    returned: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", itemSchema);

/* ---------- AUTH ROUTES ---------- */

/* ---------- Signup ---------- */
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashed,
    });

    res.json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        lostCount: user.lostCount,
        foundCount: user.foundCount,
        returnedCount: user.returnedCount,
      },
    });
  } catch {
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ---------- Login ---------- */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        lostCount: user.lostCount,
        foundCount: user.foundCount,
        returnedCount: user.returnedCount,
      },
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ---------- Get User Profile ---------- */
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ---------- ITEM ROUTES ---------- */

/* ---------- Add Lost / Found Item ---------- */
app.post("/api/items", upload.single("image"), async (req, res) => {
  try {
    const { type, productName, description, date, location, mobile, userId } =
      req.body;

    if (!userId)
      return res.status(401).json({ message: "Login required" });

    if (!type || !productName || !date || !location || !mobile)
      return res.status(400).json({ message: "Missing fields" });

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await Item.create({
      type,
      productName,
      description,
      date,
      location,
      mobile,
      image: imagePath,
      userId,
    });

    if (type === "lost") {
      await User.findByIdAndUpdate(userId, { $inc: { lostCount: 1 } });
    } else {
      await User.findByIdAndUpdate(userId, { $inc: { foundCount: 1 } });
    }

    res.json({ message: "Item added successfully", item });
  } catch {
    res.status(500).json({ message: "Failed to add item" });
  }
});

/* ---------- Get Lost / Found Items ---------- */
app.get("/api/items", async (req, res) => {
  const { type } = req.query;
  const items = await Item.find({ type }).sort({ createdAt: -1 });
  res.json(items);
});

/* ---------- Mark Item as Returned ---------- */
app.put("/api/items/:id/returned", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId)
      return res.status(401).json({ message: "Login required" });

    const item = await Item.findById(req.params.id);
    if (!item)
      return res.status(404).json({ message: "Item not found" });

    if (item.userId.toString() !== userId)
      return res.status(403).json({ message: "Not authorized" });

    if (item.returned)
      return res.status(400).json({ message: "Already returned" });

    item.returned = true;
    await item.save();

    await User.findByIdAndUpdate(userId, {
      $inc: { returnedCount: 1 },
    });

    res.json({ message: "Item marked as returned" });
  } catch {
    res.status(500).json({ message: "Failed to mark returned" });
  }
});

/* ---------- Server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
