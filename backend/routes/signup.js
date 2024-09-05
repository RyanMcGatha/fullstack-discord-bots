const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db"); // Import your PostgreSQL connection

const router = express.Router();

// Signup route to register a new user
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into the database
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Error during signup:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
