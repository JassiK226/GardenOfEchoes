// Import required packages
const express = require('express'); // framework to create server and routes
const cors = require('cors'); // allows frontend to communicate with backend
const pool = require('./db'); // connection to PostgreSQL database
const path = require('path'); // helps work with file paths
require('dotenv').config(); // loads environment variables

// Create Express 
const app = express();
console.log('Server file started');

app.use(cors()); // allows cross-origin requests
app.use(express.json()); // allows server to read JSON data from requests
app.use(express.static(path.join(__dirname, 'echos'))); // serves frontend files

// Home route - serves homepage.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'echos', 'homepage.html'));
});

// Test database connection route
app.get('/test-db', async (req, res) => {
  try {
    // Runs simple query to check connection
    const result = await pool.query('SELECT NOW()');

    res.json({
      message: 'Database connected successfully',
      time: result.rows[0],
    });
  } catch (error) {
    console.error('DB ERROR:', error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Save or update user profile data
app.post('/users', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      bio
    } = req.body;

    const savedUser = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, dob, gender, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone = EXCLUDED.phone,
         dob = EXCLUDED.dob,
         gender = EXCLUDED.gender,
         bio = EXCLUDED.bio
       RETURNING *`,
      [firstName, lastName, email, phone, dob, gender, bio]
    );

    res.json(savedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving profile' });
  }
});

// Get all users from "users" table
app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error getting users');
  }
});

// Get one user profile by email
app.get('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting user profile' });
  }
});

// Sign up route - creates new account
app.post('/signup', async (req, res) => {
  try {
    // Get signup data
    const { fullName, email, password } = req.body;

    // Insert into accounts table
    const newAccount = await pool.query(
      `INSERT INTO accounts (full_name, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [fullName, email, password]
    );

    res.json(newAccount.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error creating account' });
  }
});

// Get all accounts (for testing/debugging)
app.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting accounts' });
  }
});

// Login route - checks if user exists
app.post('/login', async (req, res) => {
  try {
    // Get login data
    const { email, password } = req.body;

    // Check if user exists with matching email and password
    const result = await pool.query(
      'SELECT * FROM accounts WHERE email = $1 AND password = $2',
      [email, password]
    );

    // If no user found → return error
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If found → return user data
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Set server port (from environment or default 3000)
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});