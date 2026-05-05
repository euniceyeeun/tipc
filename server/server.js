require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",")
  : ["http://localhost:5174"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
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

if (!process.env.SIGNUP_CODE) {
  console.warn("SIGNUP_CODE is not set. Account creation will be disabled until it is configured.");
}

app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
