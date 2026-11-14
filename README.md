# ApnaCart — MERN Stack E-Commerce Website
### "Apni Pasand. Apni Shopping."
### MCA College Project: "Design and Development of an E-Commerce Website Using the MERN Stack"

A full-stack e-commerce web application built with **MongoDB, Express.js, React.js and Node.js**.
Customers can browse, search and filter products, manage a cart, check out with Cash on Delivery,
and view order history. Administrators can manage products, categories and orders from a protected
dashboard.

> **Verification status:** This codebase was written and syntax-checked (JS/JSX parsed successfully
> with esbuild, all imports resolved) in a sandbox **without internet or database access**, so
> `npm install`, a live MongoDB connection, and the running app have **not yet been executed or
> tested by the assistant**. Follow the steps below on your own machine, and work through the
> testing checklist in `TESTING.md` to verify everything before submission.

---

## 1. Project Structure

```
mca-ecommerce/
  server/     Node.js + Express + MongoDB REST API
  client/     React + Vite frontend
  README.md   This file
  TESTING.md  Manual test checklist / Postman-style test cases
```

See inline comments in each file for explanations — this project is written to be readable by an
MCA student presenting it at a viva, not just to work.

---

## 2. Prerequisites

- **Node.js** v18+ and npm (check with `node -v` and `npm -v`)
- **MongoDB** — either:
  - **MongoDB Atlas** (free cloud cluster), or
  - **MongoDB Community Server** installed locally
- **Git** (optional, for version control)
- **Postman** (optional, for API testing — see `TESTING.md`)

---

## 3. Setting up MongoDB

### Option A — MongoDB Atlas (recommended, no local install)
1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a free (M0) cluster.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development only).
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mca_ecommerce?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user's credentials, and set a database
   name (e.g. `mca_ecommerce`) in the path. Use this as `MONGO_URI` in `server/.env`.
7. Verify the connection by running the backend (step 4 below) — a successful `MongoDB connected: ...`
   log line confirms it works. You can also inspect data with **MongoDB Compass** using the same
   connection string.

> **Note on transactions:** Atlas clusters (including the free tier) run as replica sets, so
> multi-document transactions (used when placing an order) work out of the box.

### Option B — Local MongoDB Community Server
1. Install MongoDB Community Server for your OS: https://www.mongodb.com/try/download/community
2. Start the MongoDB service (`mongod`). By default it listens on `mongodb://localhost:27017`.
3. Set `MONGO_URI=mongodb://localhost:27017/mca_ecommerce` in `server/.env`.
4. Verify with **MongoDB Compass** by connecting to `mongodb://localhost:27017`.

> **Note on transactions:** a default standalone local `mongod` does **not** support multi-document
> transactions (they require a replica set). The order-creation code in
> `server/controllers/orderController.js` detects this automatically and falls back to a safe,
> non-transactional path that still prevents overselling stock (via an atomic conditional update)
> — it just isn't fully atomic across the stock update and order creation. This is documented in
> code comments and is an acceptable, explained trade-off for a local college dev setup. If you want
> real transactions locally, you can initialize a single-node replica set
> (`mongod --replSet rs0` then `rs.initiate()` in the mongo shell).

---

## 4. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Generate a strong `JWT_SECRET`, e.g.:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Run the server:
```bash
npm run dev       # with nodemon (auto-restart)
# or
npm start         # plain node
```

You should see:
```
MongoDB connected: <host>/<db>
Server running on http://localhost:5000
```

Verify with: `curl http://localhost:5000/api/health` → `{"success":true,"message":"API is running"}`

### Seed sample data
Populates ~20 products across 5 categories. Safe to re-run — it skips anything already there.
```bash
npm run seed
```

### Create the first administrator account
**Never** create admin accounts through the public API. Use the local script instead:
```bash
npm run create-admin
```
It will prompt for a name, email and password (or read `ADMIN_NAME` / `ADMIN_EMAIL` /
`ADMIN_PASSWORD` environment variables if set). If the email already belongs to an existing
user, that account is safely promoted to `admin` instead of creating a duplicate.

### Setting up Razorpay (online payment, test mode)
Cash on Delivery works with no setup. To also enable the "Pay Online" option:
1. Sign up free at https://dashboard.razorpay.com/signup
2. Make sure you're in **Test Mode** (toggle top-right of the dashboard) — test mode needs no
   business verification and uses fake money, which is exactly what a college demo needs.
3. Go to **Settings → API Keys → Generate Test Key**. Copy the **Key Id** and **Key Secret**.
4. Paste them into `server/.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
5. Restart the backend.

**Test card/UPI details** (test mode only — these never charge real money):
- Card: `4111 1111 1111 1111`, any future expiry, any CVV, any name.
- UPI: use the UPI id `success@razorpay` to simulate a successful payment, or
  `failure@razorpay` to simulate a failed one.
- Full list of test credentials: https://razorpay.com/docs/payments/payments/test-card-upi-details/

If `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are left unset, Cash on Delivery still works fine —
only the "Pay Online" button will show a clear error instead of silently failing.

---

## 5. Frontend Setup

In a separate terminal:
```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env` if your API runs somewhere other than `http://localhost:5000/api`:
```
VITE_API_URL=http://localhost:5000/api
```

Run the dev server:
```bash
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

---

## 6. Deploying Online

For putting this live (e.g. to demo it beyond localhost), see **`DEPLOYMENT.md`** — it covers
deploying the frontend to Netlify and the backend to Render, with exact settings and environment
variables for both.

## 6a. Order Invoices (PDF)

Both the customer order-details page (`/my-orders/:id`) and the admin order-details page
(`/admin/orders/:id`) have a **Download Invoice** button. It calls
`GET /api/orders/:id/invoice`, which streams a PDF generated server-side with `pdfkit`
(`server/utils/generateInvoicePdf.js`) — nothing is written to disk, and nothing is faked: the PDF
is built from the same order document the page displays, so totals always match. The same
ownership check used by `GET /api/orders/:id` applies (the order's own customer, or an admin, only).

---

## 6b. About Us & Contact Pages

Two informational pages beyond the original spec:
- **`/about`** — static content about the project. No backend involved.
- **`/contact`** — a real contact form (name/email/subject/message) that POSTs to
  `POST /api/contact` and is saved as a `ContactMessage` document in MongoDB (rate-limited to 10
  submissions per 15 minutes per IP to deter spam). It is *not* wired to a real email inbox — this
  is a college project, not a live storefront — the form explicitly tells the user this.
  Submitted messages can be read via `GET /api/contact` (admin-only, paginated) using Postman or
  curl with an admin token; there is no dedicated admin UI page for browsing them yet, since that
  wasn't requested. It would follow the same pattern as `client/src/pages/admin/ManageOrders.jsx`
  if you want to add one.

---

## 6c. Categories & Subcategories

Categories now support one level of nesting (e.g. "Clothing" → "Men", "Women"). In
`/admin/categories`, use **Add Category** for a top-level category, or the **+** icon on an
existing top-level row to add a subcategory under it. A category that already has subcategories
cannot itself become a subcategory (one level of nesting only, to keep the catalogue simple). On
the storefront, filtering by a parent category (`/products?category=...`) automatically includes
products filed under its subcategories too.

## 6d. Wishlist & Reviews

- **Wishlist**: click the heart icon on any product card or product details page (requires login).
  View saved items at `/wishlist`. Backed by a `Wishlist` collection (one per user).
- **Reviews**: on any product details page, logged-in customers can leave a 1–5 star rating and
  comment. Submitting again *edits* your existing review rather than creating a duplicate (enforced
  by a unique index on `{product, user}`). A review shows a **Verified Purchase** badge if that user
  has a `Delivered` order containing the product — checked fresh against the `Order` collection at
  review time, not trusted from the client. Each product's `ratingsAverage`/`ratingsCount` are
  recalculated from its reviews every time one is added, edited, or deleted, so product cards can
  show a star rating without a separate query per card.

## 6e. Notification System

Two layers, both real (nothing simulated):
- **In-app notifications**: a bell icon in the navbar polls `GET /api/notifications` every 30
  seconds and shows unread count, recent notifications, and a full history at `/notifications`.
  Triggered automatically when an order is placed (COD or after Razorpay verification) and whenever
  an admin changes an order's status — see `notify()` in `server/utils/notify.js`, called from
  `orderController.js`'s shared `commitOrder()` and `updateOrderStatus()`.
- **Email notifications (optional)**: the same `notify()` call also sends a plain-text email via
  `nodemailer` if `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are set in `server/.env` (see Section 4 for
  Gmail App Password or Ethereal test-inbox setup). If left unset, email is silently skipped — a
  warning is logged once, and the in-app notification still fires normally. Email sending is
  fire-and-forget: a slow or failing mail server can never delay or fail an order.

---

## 7. Using the Application

1. Visit the home page — it loads featured products and categories from MongoDB (run the seed
   script first if the catalogue is empty).
2. **Register** a new customer account, or **log in** as the admin you created with
   `npm run create-admin`.
3. As a customer: browse `/products`, search/filter/sort, add items to the cart, go to `/checkout`,
   fill in a shipping address, and place a COD order. View it under `/my-orders`.
4. As an admin: visit `/admin` for the dashboard, manage products/categories/orders.
5. Try opening `/admin` while logged in as a customer — you should be redirected away. The backend
   independently rejects the underlying admin API calls with `403`, even if you tried to call them
   directly (e.g. from Postman) with a customer's token.

---

## 8. Architecture Notes (for your project report / viva)

- **MVC-style backend**: `models/` (Mongoose schemas) → `controllers/` (business logic) →
  `routes/` (HTTP wiring), with `middleware/` for cross-cutting concerns (auth, errors) and
  `validators/` for input validation, kept deliberately separate from controllers.
- **Security**: passwords hashed with bcrypt (never stored or returned in plaintext); JWTs signed
  with a server-only secret and verified on every protected request; role checked from the
  **database**, not from anything the client sends; prices/totals always recalculated server-side;
  Mongoose schema validation plus explicit validators reject invalid input before it reaches the
  database.
- **Data relationships**: MongoDB has no foreign keys — relationships here (`Product.category`,
  `Cart.items.product`, `Order.user`, etc.) are **application-level references** (ObjectIds)
  resolved with Mongoose's `.populate()`. Referential integrity (e.g. "don't orphan an order's
  product reference") is enforced in application code — see the safe-deactivation logic in
  `productController.js` / `categoryController.js`.
- **Order integrity**: order creation reads the cart fresh from the DB, recalculates every price,
  validates stock, and either uses a MongoDB transaction (replica set / Atlas) or a safe
  conditional-update fallback (standalone local Mongo) to avoid overselling. Cancellation restores
  stock exactly once via an `stockRestored` guard flag.
- **Online payment flow (Razorpay)**: checkout never trusts a client-reported "payment succeeded".
  `POST /api/payments/razorpay/order` creates a Razorpay order for the server-computed cart total
  (no local `Order` document yet, so an abandoned payment never leaves stock deducted). After the
  Razorpay widget reports success, the frontend calls `POST /api/payments/razorpay/verify`, which
  recomputes the HMAC-SHA256 signature server-side with the secret key, re-fetches the Razorpay
  order to confirm the amount actually paid matches the current cart total, and only then creates
  the `Order` (`paymentMethod: 'Online'`, `paymentStatus: 'Paid'`) and deducts stock — reusing the
  exact same stock/transaction logic as the COD path (`buildOrderItemsFromCart` / `commitOrder` in
  `orderController.js`, shared with `paymentController.js`).
- **Token storage trade-off**: the frontend stores the JWT in `localStorage` for simplicity, which
  is appropriate for a demo/college project but is vulnerable to XSS (any injected script could read
  it). A production system would instead issue the JWT in an `HttpOnly`, `Secure` cookie so
  client-side JavaScript can never read it. This trade-off is documented in `client/src/services/api.js`.

---

## 9. What Is Implemented vs. What You Must Verify

**Implemented in this codebase:**
All models, validation rules, REST endpoints, authentication/authorization, cart and order business
logic (stock checks, server-side pricing, transactions/fallback, cancellation with guarded stock
restoration), the full set of customer and admin pages/routes, responsive CSS, loading/error/empty
states, and seed/admin-creation scripts — per the specification.

**You must verify on your machine (the assistant could not run these in this sandbox):**
- `npm install` succeeding for both `server/` and `client/` with no dependency conflicts.
- An actual MongoDB connection (Atlas or local).
- The app running end-to-end in a browser.
- Every item in `TESTING.md`, with results actually recorded.

Do not present any checklist item as "passed" until you have run it yourself and seen the result.
