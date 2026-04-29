const mongoose = require("mongoose");

const PointSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
  },
  { _id: false }
);

const ShapeSchema = new mongoose.Schema(
  {
    points: [PointSchema],
    closed: Boolean,
  },
  { _id: false }
);

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author_first: { type: String, required: true, trim: true },
    author_last: { type: String, required: true, trim: true },
    note: { type: String, default: "" },
    owner: { type: String, required: true },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner_email: { type: String, required:true },
    available: { type: Boolean, default: true },
    shape: { type: ShapeSchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", ItemSchema, "items");
