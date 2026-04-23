require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

function deriveNameFromEmail(email) {
  const localPart = (email || "").split("@")[0] || "Library Member";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  if (!cleaned) {
    return "Library Member";
  }

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function backfillUserNames() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to run this script");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({
    $or: [
      { name: { $exists: false } },
      { name: null },
      { name: "" },
      { name: /^\s*$/ },
    ],
  });

  if (users.length === 0) {
    console.log("No users need name backfill.");
    return;
  }

  for (const user of users) {
    const nextName = deriveNameFromEmail(user.email);
    user.name = nextName;
    await user.save();
    console.log(`Backfilled ${user.email} -> ${nextName}`);
  }

  console.log(`Updated ${users.length} user(s).`);
}

backfillUserNames()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
