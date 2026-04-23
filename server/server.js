require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

mongoose.connection.once("open", () => {
  console.log("Connected to DB:", mongoose.connection.name);
});

const itemRoutes = require("./routes/items");
const authRoutes = require("./routes/auth");

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Auth routes will not work until it is configured.");
}

app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
