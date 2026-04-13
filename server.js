const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');
require('dotenv').config();

const app = express();
console.log('Server file started');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'echos')));

/*app.get('/', (req, res) => {
  res.send('Backend is running');
}); */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'echos', 'homepage.html'));
});

app.get('/test-db', async (req, res) => {
  try {
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

app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, password]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error creating user');
  }
});

app.get('/users', async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error getting users');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});