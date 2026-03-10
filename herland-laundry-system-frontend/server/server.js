const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(express.json()); // This lets the engine read JSON data

// 1. Connect to your Storage Room (Database)
const pool = new Pool({
  user: 'postgres', // Your PostgreSQL username
  host: 'localhost',
  database: 'herland_laundry',
  password: 'Lui$2115', // Put YOUR PostgreSQL password here!
  port: 5432,
});

// 2. The "Register" Path (Where new customers sign up)
app.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    // SECURITY: Turn the password into a secret "hash"
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Put the new user into the Database
    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [full_name, email, hashedPassword]
    );

    res.json({ message: "Success! User created.", user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Email already exists or Database error!" });
  }
});

// 3. The "Login" Path (Where existing customers sign in)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    // Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    res.json({ message: "Login successful!", user: { id: user.rows[0].id, email: user.rows[0].email, full_name: user.rows[0].full_name, role: user.rows[0].role } });
  } catch (err) {
    res.status(500).json({ error: "Database error!" });
  }
});

app.listen(5000, () => console.log("Engine is running on http://localhost:5000"));