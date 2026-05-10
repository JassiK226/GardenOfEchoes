# Garden of Echoes — Local Installation and Execution Guide
## Project Overview

Garden of Echoes is a web-based memorial decoration platform. The system allows users to create an account, manage their profile, save loved one information, browse products, add items to a cart, save items for later, place orders, manage subscriptions, save payment methods, save shipping addresses, submit contact messages, make donations, and preview memorial arrangements.

This README explains how to install and run the project locally.

## Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- PostgreSQL
- Render PostgreSQL database
- pgAdmin / psql for database viewing
- Postman for API testing

## Folder Structure

The project folder should look similar to this:

```text
GARDEN-OF-ECHOES-BACKEND/
│
├── echos/
│   ├── about.html
│   ├── cart-checkout.html
│   ├── cart.html
│   ├── checkout.html
│   ├── contact.html
│   ├── donation.html
│   ├── flowers.html
│   ├── homepage.html
│   ├── login.html
│   ├── product.html
│   ├── profile.html
│   ├── subscriptions.html
│   │
│   ├── logo.png
│   ├── homepage_banner.jpg
│   ├── flowerheader.jpg
│   ├── donate.jpg
│   │
│   ├── bestseller1.webp
│   ├── bestseller2.webp
│   ├── bestseller3.webp
│   ├── bestseller4.webp
│   │
│   ├── bouquet2.jpg
│   ├── bouquet3.jpg
│   ├── bouquet4.jpg
│   ├── bouquet5.jpg
│   │
│   ├── Always-In-My-Heart-Teddy.png
│   ├── Angel-Memorial-Figurine.png
│   ├── Comfort-Teddy-Bear.png
│   ├── Engraved-Memorial-Plaque.png
│   ├── flat-grave-marker.png
│   ├── Forever-In-Our-Hearts-Balloon-Set.png
│   ├── Happy-Birthday-Balloons.png
│   ├── Heart-Memorial-Plaque.png
│   ├── I-Love-You-Balloons.png
│   ├── I-Love-You-Teddy.png
│   ├── In-Loving-Memory-Candle-Fire.png
│   ├── LED-Memorial-Candle.png
│   ├── Memorial-Lantern.png
│   ├── Memorial-Wind-Chime.png
│   ├── Personalized-Garden-Stake.png
│   ├── Personalized-Memorial-Stone.png
│   ├── Personalized-Memory-Box.png
│   ├── single-upright-tombstone.png
│   ├── Solar-Memorial-Candle.png
│   ├── Thinking-Of-You-Balloon.png
│   ├── Thinking-Of-You-Teddy.png
│   ├── With-Deepest-Sympathy-Balloons.png
│   ├── With-Deepest-Sympathy-Teddy.png
│   │
│   └── FloristOneCatalog.csv
│
├── node_modules/
│
├── .env
├── .gitignore
├── db.js
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Required Software

Before running the project, install the following:

1. Node.js

Download and install Node.js from:
```text
	https://nodejs.org/
```

After installing, check that Node.js and npm are working:
```bash
	node -v
	npm -v
```

If version numbers appear, Node.js and npm are installed correctly.

2. PostgreSQL

Install PostgreSQL from:
```text
	https://www.postgresql.org/download/
```

You may also use pgAdmin to view and manage the database.

3. Code Editor

Use Visual Studio Code or any code editor.

## Step 1: Download or Unzip the Project

Download the project ZIP file and unzip it.

Open the project folder in Visual Studio Code.

Make sure you are inside the main project folder where server.js is located.

## Step 2: Install Project Dependencies

Open the terminal inside the project folder.

Run:
```bash
	npm install
```

This installs all required Node.js packages, including:
```text
	express
	cors
	pg
	dotenv
```

If needed, install them manually:
```bash
	npm install express cors pg dotenv
```

## Step 3: Create the .env File

Create a file named:
```text
	.env
```

The .env file must be in the same folder as server.js.

Add the following information:
```env
	DB_HOST=your_database_host
	DB_PORT=5432
	DB_NAME=your_database_name
	DB_USER=your_database_user
	DB_PASSWORD=your_database_password

	REMOVE_BG_API_KEY=your_remove_bg_api_key
	HUGGINGFACE_API_KEY=your_huggingface_api_key
```

Replace the values with your own database information.

Example:
```env
	DB_HOST=dpg-example.render.com
	DB_PORT=5432
	DB_NAME=garden_of_echoes
	DB_USER=garden_user
	DB_PASSWORD=yourpassword
```

Do not put quotes around the values.

## Step 4: Set Up the Database

Open PostgreSQL using pgAdmin or psql.

Create a new database for the project.

Example database name:
```text
	garden_of_echoes
```

Then run the SQL file included with the project:
```text
	database/database.sql
```

This file should create all required tables, such as:
```text
	accounts
	users
	loved_ones
	payment_methods
	shipping_addresses
	contact_messages
	donations
	subscriptions
	cart_items
	saved_for_later
	orders
	order_items
```

If using pgAdmin:
1. Open pgAdmin.
2. Select your database.
3. Open the Query Tool.
4. Copy and paste the SQL code from database.sql.
5. Click Execute.

If using psql:
```bash
	psql -U your_username -d garden_of_echoes -f database/database.sql
```

## Step 5: Check the Database Connection File

Make sure db.js looks similar to this:
```javascript
	const { Pool } = require('pg');
	require('dotenv').config();

	const pool = new Pool({
	  host: process.env.DB_HOST,
	  port: process.env.DB_PORT,
	  database: process.env.DB_NAME,
	  user: process.env.DB_USER,
	  password: process.env.DB_PASSWORD,
	  ssl: {
	    rejectUnauthorized: false
	  }
	});

	module.exports = pool;
```

## Step 6: Start the Server Locally

In the terminal, run:
```bash
	node server.js
```

If everything is working, the terminal should show:
```text
	Server file started
	Server is running on http://localhost:3000
```

## Step 7: Open the Website Locally

Open your browser and go to:
```text
	http://localhost:3000
```

This should load the homepage.

You can also open specific pages:
```text
	http://localhost:3000/homepage.html
	http://localhost:3000/login.html
	http://localhost:3000/profile.html
	http://localhost:3000/flowers.html
	http://localhost:3000/cart.html	
	http://localhost:3000/donation.html
	http://localhost:3000/subscriptions.html
```

## Step 8: Test the Database Connection

In the browser, go to:
```text
	http://localhost:3000/test-db
```

If the database is connected, you should see a message like:
```JSON
	{
		  "message": "Database connected successfully",
		  "time": {
		    	"now": "..."
	  	  }
	}
```

If there is an error, check:
* .env file values
* database name
* database password
* Render database connection information
* internet connection
* whether PostgreSQL is running

## Step 9: Main System Features to Test

1. Sign Up

Go to:
```text
	http://localhost:3000/login.html
```

Create a new account using name, email, and password.

The account should be saved in the accounts table.

2. Log In

Go to:
```text
	http://localhost:3000/login.html
```

Log in using the account you created.

After login, the user email and full name are saved in localStorage so the website knows which user is currently logged in.

3. Edit Profile

Go to:
```text
	http://localhost:3000/profile.html
```

Use the Edit Profile tab to save:
* first name
* last name
* email
* phone number
* address
* city
* state
* ZIP code
* date of birth
* gender
* bio
* password changes

This information is saved in the users table.

4. Add Passed Loved One

In the profile page, open the Passed Loved One tab.

You can save:
* first name
* last name
* birth date
* passing date
* cemetery / resting place
* plot number
* section
* row
* notes
* memory icon

This information is saved in the loved_ones table.

5. Save Payment Method

In the profile page, open the Saved Payment tab.

You can add a card with:
* name on card
* card number
* expiration date
* CVV
* billing ZIP code

Only the last 4 digits of the card are saved for display.

Saved cards are stored in the payment_methods table.

6. Save Shipping Address

In the profile page, open the Saved Shipping Address tab.

You can save:
* first name
* last name
* address line 1
* address line 2
* city
* state
* ZIP code
* country
* phone number

Saved addresses are stored in the shipping_addresses table.

7. Browse Products

Go to:
```text
	http://localhost:3000/flowers.html
```

Users can browse flowers and memorial gifts.

Products can be added to the cart.

8. Cart

Go to:
```text
	http://localhost:3000/cart.html
```

The cart allows users to:
* view selected items
* increase quantity
* decrease quantity
* remove items
* edit engraving messages
* save items for later
* move saved items back to cart

Saved for later items are stored in the saved_for_later table.

9. Checkout

Go to the cart and click:
```text
	Proceed To Checkout
```

The checkout page allows the user to:
* choose a saved loved one
* enter billing information
* enter card information
* choose placement for memorial preview
* generate a preview
* place an order

Orders are saved in:
```text
	orders
	order_items
```

10. Order History

After placing an order, go to:
```text
	http://localhost:3000/profile.html
```

Open the Order History tab.

The user should see previous orders, including:

* order status
* total
* loved one name
* billing address
* ordered products
* personalization messages

11. Subscriptions

Go to:
```text
	http://localhost:3000/subscriptions.html
```

Users can choose subscription plans such as:
* weekly
* bi-weekly
* monthly
* every 3 months
* every 6 months
* yearly
* holiday-based plans

After selecting a plan, the user is sent to checkout.

Subscriptions are saved in the subscriptions table.

12. Donations

Go to:
```text
	http://localhost:3000/donation.html
```

Users can enter:
* donation amount
* full name
* email address
* message

Donation data is saved in the donations table.

13. Contact Form

Go to:
```text
	http://localhost:3000/contact.html
```

Users can submit:
* name
* email
* phone
* message

Messages are saved in the contact_messages table.

## Step 10: Useful Testing URLs

These routes can be used to check if data is saving correctly:
```text
	http://localhost:3000/test-db
	http://localhost:3000/users
	http://localhost:3000/accounts
	http://localhost:3000/all-loved-ones
	http://localhost:3000/all-payment-methods
	http://localhost:3000/all-shipping-addresses
	http://localhost:3000/contact-messages
	http://localhost:3000/donations
	http://localhost:3000/all-subscriptions 
```

Some routes require a user email in the URL:
```text
	http://localhost:3000/users/useremail@example.com
	http://localhost:3000/loved-ones/useremail@example.com
	http://localhost:3000/payment-methods/useremail@example.com
	http://localhost:3000/shipping-addresses/useremail@example.com
	http://localhost:3000/orders/useremail@example.com
	http://localhost:3000/subscriptions/useremail@example.com
```

Replace useremail@example.com with the actual email used during signup.

## Step 11: Stopping the Server

To stop the local server, go to the terminal and press:
```text
	Control + C
```

On Mac, this is also:
```text
	Control + C
```

## Troubleshooting

### Problem: Cannot GET / 

Make sure this route exists in server.js:
```javascript
	app.get('/', (req, res) => {
	  res.sendFile(path.join(__dirname, 'echos', 'homepage.html'));
	});
```

Also make sure homepage.html is inside the echos folder.

### Problem: CSS or images are not loading

Make sure this line is in server.js:
```javascript
	app.use(express.static(path.join(__dirname, 'echos')));
```

Also make sure image files are inside the echos folder.

### Problem: Database connection failed

Check:
1. .env file exists.
2. .env is in the same folder as server.js.
3. Database password is correct.
4. Database host is correct.
5. Database name is correct.
6. PostgreSQL database exists.
7. SSL is enabled in db.js.

### Problem: relation does not exist

This means the database table has not been created yet.

Run the SQL file again:
```text
	database/database.sql
```

### Problem: Port already in use

If port 3000 is already being used, stop the other server or change the port in server.js:
```javascript
	const PORT = process.env.PORT || 3000;
```

Example:
```javascript
	const PORT = process.env.PORT || 4000;
```

Then open:
```text
	http://localhost:4000
```

### Problem: Login does not work

Check that the account exists in the accounts table.

You can test by opening:
```text
	http://localhost:3000/accounts
```

### Problem: Profile does not load

Make sure the email is saved in localStorage after login.

The website uses localStorage to know which user is currently signed in.

### Problem: API key features do not work

Some features require API keys in the .env file:
```env
	REMOVE_BG_API_KEY=your_remove_bg_api_key
	HUGGINGFACE_API_KEY=your_huggingface_api_key
```

If these keys are missing, background removal or image generation may not work.

The rest of the website can still run locally without those features.

## Local Execution Summary

To run the project locally:
```bash
	cd GardenOfEchoes
	npm install
	node server.js
```

Then open:
```text
	http://localhost:3000
```

## Notes
* The frontend files are stored inside the echos folder.
* The backend runs from server.js.
* PostgreSQL stores user accounts, profiles, loved ones, payments, addresses, orders, donations, subscriptions, saved items, and contact messages.
* The website must be opened through localhost:3000, not by double-clicking the HTML files, because the backend routes and database connection require the Express server.
