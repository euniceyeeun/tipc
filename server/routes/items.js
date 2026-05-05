const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET single item
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    let owner_email = null;
    if (item.owner) {
      const owner = await User.findOne({ name: item.owner }).lean();
      owner_email = owner?.email ?? null;
    }

    res.json({ ...item.toObject(), owner_email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// POST new item
router.post("/", requireAuth, async (req, res) => {
  const { title, author_first, author_last, note, available, shape } = req.body;

  if (!title || !author_first || !author_last) {
    return res
      .status(400)
      .json({
        error: "Title, author first name, and author last name are required",
      });
  }

  try {
    const newItem = new Item({
      title: title.trim(),
      author_first: author_first.trim(),
      author_last: author_last.trim(),
      note: note?.trim() || "",
      owner: req.user.name || req.user.email,
      ownerUserId: req.user.userId,
      available: typeof available === "boolean" ? available : true,
      shape,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// PATCH item details owned by the current user
router.patch("/:id", requireAuth, async (req, res) => {
  const { note, available } = req.body;

  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (item.ownerUserId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own items" });
    }

    if (typeof note === "string") {
      item.note = note.trim();
    }

    item.available =
  typeof available === "boolean" ? available : item.available;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

module.exports = router;
