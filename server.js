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

// Save a loved one
app.post('/loved-ones', async (req, res) => {
  try {
    const {
      userEmail,
      firstName,
      lastName,
      birthDate,
      passedDate,
      cemetery,
      notes
    } = req.body;

    const newLovedOne = await pool.query(
      `INSERT INTO loved_ones
      (user_email, first_name, last_name, birth_date, passed_date, cemetery, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userEmail, firstName, lastName, birthDate, passedDate, cemetery, notes]
    );

    res.json(newLovedOne.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving loved one' });
  }
});

// Get all loved ones for a user
app.get('/loved-ones/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      'SELECT * FROM loved_ones WHERE user_email = $1 ORDER BY id ASC',
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting loved ones' });
  }
});

// Save a payment method
app.post('/payment-methods', async (req, res) => {
  try {
    const {
      userEmail,
      cardName,
      cardNumber,
      expiry,
      billingZip
    } = req.body;

    // Only save last 4 digits
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const cardLast4 = cleanCardNumber.slice(-4);

    // Simple card type detection
    let cardType = 'Card';
    if (cleanCardNumber.startsWith('4')) {
      cardType = 'Visa';
    } else if (/^5[1-5]/.test(cleanCardNumber)) {
      cardType = 'Mastercard';
    } else if (/^3[47]/.test(cleanCardNumber)) {
      cardType = 'American Express';
    } else if (/^6/.test(cleanCardNumber)) {
      cardType = 'Discover';
    }

    // Check if user already has a default card
    const existingDefault = await pool.query(
      'SELECT * FROM payment_methods WHERE user_email = $1 AND is_default = TRUE',
      [userEmail]
    );

    const isDefault = existingDefault.rows.length === 0;

    const newPayment = await pool.query(
      `INSERT INTO payment_methods
      (user_email, card_name, card_last4, expiry, billing_zip, card_type, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userEmail, cardName, cardLast4, expiry, billingZip, cardType, isDefault]
    );

    res.json(newPayment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving payment method' });
  }
});

// Get all payment methods for a user
app.get('/payment-methods/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE user_email = $1 ORDER BY is_default DESC, id ASC',
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting payment methods' });
  }
});

// Delete a payment method
app.delete('/payment-methods/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      'DELETE FROM payment_methods WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ message: 'Payment method deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error deleting payment method' });
  }
});

// Set a payment method as default
app.put('/payment-methods/:id/default', async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;

    // First remove default from all this user's cards
    await pool.query(
      'UPDATE payment_methods SET is_default = FALSE WHERE user_email = $1',
      [userEmail]
    );

    // Then set selected card as default
    const result = await pool.query(
      'UPDATE payment_methods SET is_default = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error setting default payment method' });
  }
});

// Update a payment method
app.put('/payment-methods/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { cardName, expiry, billingZip } = req.body;

    const result = await pool.query(
      `UPDATE payment_methods
       SET card_name = $1,
           expiry = $2,
           billing_zip = $3
       WHERE id = $4
       RETURNING *`,
      [cardName, expiry, billingZip, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error updating payment method' });
  }
});

// Save a shipping address
app.post('/shipping-addresses', async (req, res) => {
  try {
    const {
      userEmail,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      phone
    } = req.body;

    // First address for this user becomes default automatically
    const existingDefault = await pool.query(
      'SELECT * FROM shipping_addresses WHERE user_email = $1 AND is_default = TRUE',
      [userEmail]
    );

    const isDefault = existingDefault.rows.length === 0;

    const newAddress = await pool.query(
      `INSERT INTO shipping_addresses
      (user_email, first_name, last_name, address_line1, address_line2, city, state, zip_code, country, phone, label, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userEmail,
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        phone,
        'Home',
        isDefault
      ]
    );

    res.json(newAddress.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving address' });
  }
});

// Get all shipping addresses for a user
app.get('/shipping-addresses/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      'SELECT * FROM shipping_addresses WHERE user_email = $1 ORDER BY is_default DESC, id ASC',
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting addresses' });
  }
});

// Delete a shipping address
app.delete('/shipping-addresses/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await pool.query(
      'DELETE FROM shipping_addresses WHERE id = $1 RETURNING *',
      [id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error deleting address' });
  }
});

// Set a shipping address as default
app.put('/shipping-addresses/:id/default', async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;

    await pool.query(
      'UPDATE shipping_addresses SET is_default = FALSE WHERE user_email = $1',
      [userEmail]
    );

    const result = await pool.query(
      'UPDATE shipping_addresses SET is_default = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error setting default address' });
  }
});

// Update a shipping address
app.put('/shipping-addresses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      phone
    } = req.body;

    const result = await pool.query(
      `UPDATE shipping_addresses
       SET first_name = $1,
           last_name = $2,
           address_line1 = $3,
           address_line2 = $4,
           city = $5,
           state = $6,
           zip_code = $7,
           country = $8,
           phone = $9
       WHERE id = $10
       RETURNING *`,
      [
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        phone,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error updating address' });
  }
});



// Set server port (from environment or default 3000)
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});