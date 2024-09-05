const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db"); // PostgreSQL connection

const router = express.Router();

// Signin route to authenticate a user
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the user exists in the database
    const user = await pool.query("SELECT * FROM Users WHERE username = $1", [
      username,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Compare the submitted password with the hashed password in the database
    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Authentication successful
    res.status(200).json({ message: "Signin successful", user: user.rows[0] });

    // Optionally, you can generate a JWT token here for session management
    // const token = generateToken(user.rows[0]);
    // res.json({ message: "Signin successful", token });
  } catch (err) {
    console.error("Error during signin:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
