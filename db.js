// Import PostgreSQL library
const { Pool } = require('pg');

// Load environment variables from .env file
require('dotenv').config();

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
  host: process.env.DB_HOST,       // database host (from Render)
  port: process.env.DB_PORT,       // database port (usually 5432)
  database: process.env.DB_NAME,   // database name
  user: process.env.DB_USER,       // database username
  password: process.env.DB_PASSWORD, // database password

  // Required for secure connection to Render (SSL)
  ssl: {
    rejectUnauthorized: false
  }
});

// Export pool so it can be used in other files (like server.js)
module.exports = pool;