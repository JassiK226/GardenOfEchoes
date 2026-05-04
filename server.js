// Import required packages
const express = require('express'); // framework to create server and routes
const cors = require('cors'); // allows frontend to communicate with backend
const pool = require('./db'); // connection to PostgreSQL database
const path = require('path'); // helps work with file paths
require('dotenv').config(); // loads environment variables

// Create Express app
const app = express();
console.log('Server file started');

// Middleware
app.use(cors()); // allows cross-origin requests
app.use(express.json()); // lets server read JSON data sent from frontend
app.use(express.static(path.join(__dirname, 'echos'))); // serves frontend files from echos folder

// Home route - serves homepage.html when user goes to main URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'echos', 'homepage.html'));
});

// Test database connection route
app.get('/test-db', async (req, res) => {
  try {
    // Runs a simple query to make sure PostgreSQL is connected
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
    // Get profile form data from frontend
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      bio
    } = req.body;

    // Insert new profile row, or update it if the email already exists
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

    // Send saved profile back to frontend
    res.json(savedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving profile' });
  }
});

// Get all users from users table
app.get('/users', async (req, res) => {
  try {
    // Useful for testing all saved users
    const allUsers = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(allUsers.rows, null, 2));
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error getting users');
  }
});

// Get one user profile by email
app.get('/users/:email', async (req, res) => {
  try {
    const email = req.params.email; // get email from URL

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // If no matching profile exists, return error
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
    // Get signup data from frontend
    const { fullName, email, password } = req.body;

    // Insert new account into accounts table
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

// Get all accounts (mainly for testing/debugging)
app.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting accounts' });
  }
});

// Login route - checks if user exists in accounts table
app.post('/login', async (req, res) => {
  try {
    // Get login info typed by user
    const { email, password } = req.body;

    // Check if email and password match a saved account
    const result = await pool.query(
      'SELECT * FROM accounts WHERE email = $1 AND password = $2',
      [email, password]
    );

    // If no account found, return login error
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If account found, return that account data
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
      notes,
      icon
    } = req.body;

    const newLovedOne = await pool.query(
      `INSERT INTO loved_ones
      (user_email, first_name, last_name, birth_date, passed_date, cemetery, notes, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [userEmail, firstName, lastName, birthDate, passedDate, cemetery, notes, icon || '🌸']
    );

    res.json(newLovedOne.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving loved one' });
  }
});

// Get one loved one by ID
app.get('/loved-one/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      'SELECT * FROM loved_ones WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loved one not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error getting loved one' });
  }
});

// Get all loved ones for one user
app.get('/loved-ones/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      'SELECT * FROM loved_ones WHERE user_email = $1 ORDER BY id ASC',
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error getting loved ones' });
  }
});

// Delete a loved one
app.delete('/loved-ones/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      'DELETE FROM loved_ones WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loved one not found' });
    }

    res.json({ message: 'Loved one deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error deleting loved one' });
  }
});

// Update a loved one
// Update a loved one
app.put('/loved-ones/:id', async (req, res) => {
  try {
    const id = req.params.id;

    let {
      firstName,
      lastName,
      birthDate,
      passedDate,
      cemetery,
      notes,
      icon
    } = req.body;

    // Convert empty dates to null so PostgreSQL accepts them
    birthDate = birthDate || null;
    passedDate = passedDate || null;

    const result = await pool.query(
      `UPDATE loved_ones
       SET first_name = $1,
           last_name = $2,
           birth_date = $3,
           passed_date = $4,
           cemetery = $5,
           notes = $6,
           icon = $7
       WHERE id = $8
       RETURNING *`,
      [firstName, lastName, birthDate, passedDate, cemetery, notes, icon || '🌸', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loved one not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));

  } catch (err) {
    console.error('UPDATE LOVED ONE ERROR:', err.message);
    res.status(500).json({ error: 'Error updating loved one' });
  }
});

// Save a payment method
app.post('/payment-methods', async (req, res) => {
  try {
    // Get card form data from frontend
    const {
      userEmail,
      cardName,
      cardNumber,
      expiry,
      billingZip
    } = req.body;

    // Remove spaces from card number and keep only the last 4 digits
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    const cardLast4 = cleanCardNumber.slice(-4);

    // Simple card type detection based on first number(s)
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

    // Check if user already has a default card saved
    const existingDefault = await pool.query(
      'SELECT * FROM payment_methods WHERE user_email = $1 AND is_default = TRUE',
      [userEmail]
    );

    // If they do not have one yet, this new card becomes default
    const isDefault = existingDefault.rows.length === 0;

    // Save payment method in database
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

    // Show default card first, then other cards
    const result = await pool.query(
      'SELECT * FROM payment_methods WHERE user_email = $1 ORDER BY is_default DESC, id ASC',
      [email]
    );

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting payment methods' });
  }
});

// Delete a payment method
app.delete('/payment-methods/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Delete selected card by id
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

    // Remove default status from all of this user's cards first
    await pool.query(
      'UPDATE payment_methods SET is_default = FALSE WHERE user_email = $1',
      [userEmail]
    );

    // Then make selected card the new default
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

    // Update card info that user edited
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
    // Get address form data from frontend
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

    // First address saved for a user becomes default automatically
    const existingDefault = await pool.query(
      'SELECT * FROM shipping_addresses WHERE user_email = $1 AND is_default = TRUE',
      [userEmail]
    );

    const isDefault = existingDefault.rows.length === 0;

    // Insert new shipping address into database
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

    // Show default address first, then the rest
    const result = await pool.query(
      'SELECT * FROM shipping_addresses WHERE user_email = $1 ORDER BY is_default DESC, id ASC',
      [email]
    );

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting addresses' });
  }
});

// Delete a shipping address
app.delete('/shipping-addresses/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Delete selected address by id
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

    // Remove default from all addresses for this user first
    await pool.query(
      'UPDATE shipping_addresses SET is_default = FALSE WHERE user_email = $1',
      [userEmail]
    );

    // Set chosen address as the new default
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

    // Update selected address with new form data
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

// Get all loved ones (for testing/debugging)
app.get('/all-loved-ones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loved_ones ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting loved ones' });
  }
});

// Get all payment methods (for testing/debugging)
app.get('/all-payment-methods', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payment_methods ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting payment methods' });
  }
});

// Get all shipping addresses (for testing/debugging)
app.get('/all-shipping-addresses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipping_addresses ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting shipping addresses' });
  }
});

// Save contact form message
app.post('/contact-messages', async (req, res) => {
  try {
    // Get contact form data from frontend
    const { name, email, phone, message } = req.body;

    // Insert message into contact_messages table
    const newMessage = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone, message]
    );

    res.json(newMessage.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving contact message' });
  }
});

// Get all contact messages for testing/debugging
app.get('/contact-messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY id ASC');

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting contact messages' });
  }
});

// Save a subscription
app.post('/subscriptions', async (req, res) => {
  try {
    const {
      userEmail, planId, planName, planPrice, amount, lovedOneId,
      addressLine1, addressLine2, city, state, zipCode
    } = req.body;

    const result = await pool.query(
      `INSERT INTO subscriptions
      (user_email, plan_id, plan_name, plan_price, amount, status, loved_one_id,
       address_line1, address_line2, city, state, zip_code)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [userEmail, planId, planName, planPrice, amount, 'Active', lovedOneId,
       addressLine1, addressLine2, city, state, zipCode]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('SUBSCRIPTION ERROR:', err.message);
    res.status(500).json({ error: 'Error saving subscription' });
  }
});

// Get subscriptions for one user
app.get('/subscriptions/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      `SELECT s.*, l.first_name AS loved_first_name, l.last_name AS loved_last_name
       FROM subscriptions s
       LEFT JOIN loved_ones l ON s.loved_one_id = l.id
       WHERE s.user_email = $1
       ORDER BY s.id DESC`,
      [email]
    );

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting subscriptions' });
  }
});

// Get all subscriptions for testing/debugging
app.get('/all-subscriptions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting subscriptions' });
  }
});

// Save a subscription
app.post('/subscriptions', async (req, res) => {
  try {
    const {
      userEmail,
      lovedOneId,
      planId,
      planName,
      planPrice,
      amount,
      firstName,
      lastName,
      email,
      phone,
      address,
      address2,
      city,
      state,
      zipCode
    } = req.body;

    const newSubscription = await pool.query(
      `INSERT INTO subscriptions
      (user_email, loved_one_id, plan_id, plan_name, plan_price, amount,
       first_name, last_name, email, phone, address, address2, city, state, zip_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        userEmail,
        lovedOneId,
        planId,
        planName,
        planPrice,
        amount,
        firstName,
        lastName,
        email,
        phone,
        address,
        address2,
        city,
        state,
        zipCode
      ]
    );

    res.json(newSubscription.rows[0]);
  } catch (err) {
    console.error('SUBSCRIPTION ERROR:', err.message);
    res.status(500).json({ error: 'Error saving subscription' });
  }
});

// Get subscriptions for one user
app.get('/subscriptions/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      `SELECT subscriptions.*, loved_ones.first_name AS loved_first_name, loved_ones.last_name AS loved_last_name
       FROM subscriptions
       LEFT JOIN loved_ones ON subscriptions.loved_one_id = loved_ones.id
       WHERE subscriptions.user_email = $1
       ORDER BY subscriptions.created_at DESC`,
      [email]
    );

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting subscriptions' });
  }
});

// Get all subscriptions for testing
app.get('/all-subscriptions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions ORDER BY id ASC');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting subscriptions' });
  }
});

// Delete / unsubscribe from a subscription
app.delete('/subscriptions/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const result = await pool.query(
      'DELETE FROM subscriptions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error removing subscription' });
  }
});

// Save donation
app.post('/donations', async (req, res) => {
  try {
    const { donorName, donorEmail, message, amount } = req.body;

    const result = await pool.query(
      `INSERT INTO donations (donor_name, donor_email, message, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [donorName, donorEmail, message, amount]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error saving donation' });
  }
});

// View all donations
app.get('/donations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donations ORDER BY id ASC');

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting donations' });
  }
});

/*
app.post('/generate-preview', async (req, res) => {
  try {
    const { prompt, images } = req.body;

    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HUGGING FACE ERROR:', errorText);
      return res.status(500).json({
        error: 'Hugging Face request failed',
        details: errorText
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`
    });

  } catch (err) {
    console.error('IMAGE GENERATION ERROR:', err);
    res.status(500).json({
      error: 'Error generating image',
      details: err.message
    });
  }
}); */

app.post('/generate-preview', async (req, res) => {
  try {
    const { prompt, images } = req.body;

    const imageReferenceText = images && images.length > 0
      ? `
Use these product image URLs as visual references for the exact flowers/items:
${images.map((img, index) => `Product ${index + 1}: ${img}`).join('\n')}
`
      : '';

    const finalPrompt = `
${prompt}

${imageReferenceText}

Very important:
- Include every selected product.
- Do not ignore any selected bouquet.
- If there are two bouquets, show two different bouquets.
- Follow the placement instructions exactly.
- If the memorial type is flat grave marker, make it a flat grave marker on the ground, not an upright tombstone.
- The stone must be blank with no readable text.
`;

    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: finalPrompt
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HUGGING FACE ERROR:', errorText);
      return res.status(500).json({
        error: 'Hugging Face request failed',
        details: errorText
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    res.json({
      imageUrl: `data:image/png;base64,${base64Image}`
    });

  } catch (err) {
    console.error('IMAGE GENERATION ERROR:', err);
    res.status(500).json({
      error: 'Error generating image',
      details: err.message
    });
  }
});

// Add item to cart
app.post('/cart', async (req, res) => {
  try {
    const { userEmail, productName, productPrice, productImage } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'User must be logged in' });
    }

    const existingItem = await pool.query(
      `SELECT * FROM cart_items 
       WHERE user_email = $1 AND product_name = $2`,
      [userEmail, productName]
    );

    if (existingItem.rows.length > 0) {
      const updatedItem = await pool.query(
        `UPDATE cart_items
         SET quantity = quantity + 1
         WHERE user_email = $1 AND product_name = $2
         RETURNING *`,
        [userEmail, productName]
      );

      return res.json(updatedItem.rows[0]);
    }

    const newItem = await pool.query(
      `INSERT INTO cart_items
       (user_email, product_name, product_price, product_image, quantity)
       VALUES ($1, $2, $3, $4, 1)
       RETURNING *`,
      [userEmail, productName, productPrice, productImage]
    );

    res.json(newItem.rows[0]);

  } catch (err) {
    console.error('CART ERROR:', err.message);
    res.status(500).json({ error: 'Error adding item to cart' });
  }
});

// Get cart items for one user
app.get('/cart/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const result = await pool.query(
      `SELECT * FROM cart_items 
       WHERE user_email = $1 
       ORDER BY id ASC`,
      [email]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('GET CART ERROR:', err.message);
    res.status(500).json({ error: 'Error getting cart' });
  }
});

// Remove item from cart
app.delete('/cart/:id', async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query(
      `DELETE FROM cart_items WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Item removed from cart' });

  } catch (err) {
    console.error('DELETE CART ERROR:', err.message);
    res.status(500).json({ error: 'Error removing item' });
  }
});

// Place cart order
app.post('/orders', async (req, res) => {
  try {
    const {
      userEmail,
      lovedOneId,
      customerName,
      customerEmail,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      cardNumber,
      total,
      items
    } = req.body;

    const cardLast4 = cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : null;

    const orderResult = await pool.query(
      `INSERT INTO orders
      (user_email, loved_one_id, customer_name, customer_email, phone,
       address_line1, address_line2, city, state, zip_code, card_last4, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        userEmail,
        lovedOneId || null,
        customerName,
        customerEmail,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        cardLast4,
        total
      ]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items
        (order_id, product_name, product_image, price, quantity)
        VALUES ($1,$2,$3,$4,$5)`,
        [
          order.id,
          item.name,
          item.image,
          item.price,
          item.quantity || 1
        ]
      );
    }

    res.json(order);
  } catch (err) {
    console.error('ORDER ERROR:', err.message);
    res.status(500).json({ error: 'Error placing order' });
  }
});

// Get orders for profile page
app.get('/orders/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const orders = await pool.query(
      `SELECT o.*, l.first_name AS loved_first_name, l.last_name AS loved_last_name
       FROM orders o
       LEFT JOIN loved_ones l ON o.loved_one_id = l.id
       WHERE o.user_email = $1
       ORDER BY o.created_at DESC`,
      [email]
    );

    for (let order of orders.rows) {
      const items = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );

      order.items = items.rows;
    }

    res.json(orders.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error getting orders' });
  }
});

app.post('/remove-bg', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        size: 'auto'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('REMOVE BG ERROR:', errorText);
      return res.status(500).json({ error: 'Background removal failed' });
    }

    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    res.json({
      image: `data:image/png;base64,${base64Image}`
    });

  } catch (err) {
    console.error('REMOVE BG SERVER ERROR:', err);
    res.status(500).json({ error: 'Error removing background' });
  }
});

// Set server port from environment, or use 3000 if none is provided
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});