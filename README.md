# ShopCom — MERN Stack E-Commerce Website

### MCA Academic Project

ShopCom is my MCA academic project, developed to demonstrate how a full-stack e-commerce website can be built using the MERN stack. The website allows users to browse products, search for items, manage their shopping cart, place orders, and make payments. It also includes an admin dashboard for managing products, categories, and orders.

The main goal of this project is to build a simple, responsive, and user-friendly online shopping platform while learning how frontend, backend, database, and payment systems work together.

## Features

- **User Authentication:** Register and log in securely.
- **Product Browsing:** View, search, and filter products by category.
- **Shopping Cart:** Add products, remove items, and update quantities.
- **Checkout:** Enter a shipping address and place orders.
- **Payment Options:** Cash on Delivery and Razorpay online payments.
- **Order History:** View previously placed orders.
- **Admin Dashboard:** Manage products, categories, and customer orders.
- **Responsive Design:** Use the website on desktop and mobile devices.
- **Security:** Password hashing, JWT authentication, and role-based access control.

## Technologies Used

| Technology   | Purpose                             |
|--------------|-------------------------------------|
| MongoDB      | Store application data              |
| Express.js   | Build backend APIs                  |
| React.js     | Develop the user interface          |
| Node.js      | Run the backend server              |
| Vite         | Frontend development and build tool |
| Mongoose     | Connect Node.js with MongoDB        |
| JWT          | User authentication                 |
| bcryptjs     | Password hashing                    |
| Razorpay     | Online payment integration          |
| Axios        | Make API requests                   |
| Lucide React | Display interface icons             |

## Project Structure

```text
mca-ecommerce/
├── client/          # React frontend
├── server/          # Node.js and Express backend
├── README.md        # Project documentation
└── TESTING.md       # Testing checklist
```

## Installation and Setup

### 1. Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB Atlas account or a local MongoDB server
- Postman (optional, for API testing)

### 2. Clone the Repository

```bash
git clone <your-github-repository-url>
cd mca-ecommerce
```

Replace the repository URL with your actual GitHub repository URL.

### 3. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

Replace the example values with your own configuration. Keep your `.env` file private and never upload it to GitHub.

Start the backend:

```bash
npm run dev
```

### 4. Set Up the Frontend

Open another terminal from the project root:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` folder:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually `http://localhost:5173`.

### 5. Configure MongoDB

To use MongoDB Atlas:

1. Create a cluster in MongoDB Atlas.
2. Create a database user with a username and password.
3. Configure Network Access to allow your development machine to connect.
4. Copy the connection string from Atlas.
5. Add it to `MONGO_URI` in `server/.env`.
6. Restart the backend and verify the database connection.

### 6. Configure Razorpay

Online payments require Razorpay API credentials.

1. Create a Razorpay account.
2. Open the Razorpay Dashboard and enable Test Mode.
3. Generate test API keys.
4. Add the keys to `server/.env`.
5. Restart the backend.

Test Mode can be used to demonstrate the payment process without charging real money. Cash on Delivery can be used without configuring online payments, provided the backend supports that option.

## How to Use ShopCom

1. Register a new customer account or log in.
2. Browse products and search or filter by category.
3. Add products to the shopping cart.
4. Proceed to checkout and enter the shipping address.
5. Select Cash on Delivery or online payment, if configured.
6. View your orders in the order history section.
7. Log in with an administrator account to manage products, categories, and orders.

## Security and Data Management

The project includes several measures to handle data safely:

- Passwords are hashed before being stored.
- Protected API routes require authentication.
- Admin operations require appropriate authorization.
- Product prices and order totals are calculated on the backend.
- Stock availability is checked before an order is placed.
- Order records preserve relevant product and price information.
- Payment verification is performed on the backend when online payments are used.

## Testing

The project includes a `TESTING.md` checklist for checking authentication, product management, cart operations, order processing, admin access, and payments.

Before considering the project complete, I will verify the application locally, test the database connection, check the payment flow in test mode, and record the results of the test cases.

## Learning Outcomes

Through this project, I aim to gain practical experience with:

- Full-stack web development using the MERN stack.
- REST API development and integration.
- Database design and data relationships.
- Authentication and role-based authorization.
- Shopping cart and order management.
- Online payment integration.
- Testing, debugging, and project documentation.

## Project Status

This is an MCA academic project. The application is intended to demonstrate the development of a full-stack e-commerce website. Features and integrations should be tested in the local environment before the project is considered fully functional.

## Author

**Sourabh Mondal**

MCA Student | Full-Stack Web Development

---

*ShopCom — Shop Smart. Shop Simple.*