# Testing Checklist — ApnaCart

Fill in **Actual Result** and **Pass/Fail** yourself after running each test against your own running
instance (backend on `http://localhost:5000`, frontend on `http://localhost:5173`). Do not mark a
test "Pass" until you have actually executed it. Use Postman, curl, or the browser as indicated.

Legend: 🖥️ = browser test, 📮 = Postman/curl test.

---

## A. Authentication

| ID | Description | Preconditions | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|---|
| AUTH-01 🖥️ | Register a new customer | None | Valid name/email/password on `/register` | Account created, redirected to home, logged in | | |
| AUTH-02 📮 | Reject duplicate email | A user with `test@example.com` exists | `POST /api/auth/register` with same email | `409 Conflict`, "email already exists" | | |
| AUTH-03 🖥️/📮 | Reject incorrect password | Registered user exists | `POST /api/auth/login` with wrong password | `401 Unauthorized`, "Invalid email or password" | | |
| AUTH-04 📮 | Block unauthenticated access | None | `GET /api/cart` with no `Authorization` header | `401 Unauthorized` | | |
| AUTH-05 📮 | Reject expired/invalid JWT | None | `GET /api/auth/me` with a malformed token | `401 Unauthorized` | | |
| AUTH-06 📮 | Reject admin role injection at registration | None | `POST /api/auth/register` with `"role": "admin"` in body | User created with `role: "customer"` regardless | | |
| AUTH-07 🖥️ | Passwords never returned | Logged in | Inspect `GET /api/auth/me` response in DevTools Network tab | No `password` field present anywhere | | |

## B. Products

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| PROD-01 🖥️ | Products load from MongoDB | Visit `/products` after seeding | Grid of ~20 products displayed | | |
| PROD-02 🖥️ | Search by name | Search "headphones" | Only matching product(s) shown | | |
| PROD-03 🖥️ | Filter by category | Select "Books" | Only Books products shown | | |
| PROD-04 🖥️ | Sort by price | Select "Price: Low to High" | Products ordered ascending by price | | |
| PROD-05 📮 | Reject negative price | `POST /api/products` (admin token) with `price: -5` | `400 Bad Request` with validation message | | |
| PROD-06 📮 | Reject fractional stock | `POST /api/products` with `stock: 3.5` | `400 Bad Request` | | |
| PROD-07 📮 | Reject invalid product id | `GET /api/products/not-a-valid-id` | `400 Bad Request` | | |
| PROD-08 📮 | Customer cannot create product | `POST /api/products` with a **customer** token | `403 Forbidden` | | |

## C. Cart and Orders

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| CART-01 🖥️ | Add product to cart | Click "Add to Cart" on a product | Cart badge increments, item appears in `/cart` | | |
| CART-02 🖥️ | Update quantity | Change quantity on cart page | Line total and subtotal update | | |
| CART-03 🖥️ | Remove item | Click trash icon | Item removed, totals recalculated | | |
| CART-04 📮 | Reject negative quantity | `POST /api/cart/items` with `quantity: -1` | `400 Bad Request` | | |
| CART-05 📮 | Reject over-stock order | Add quantity greater than available stock, then checkout | `400 Bad Request`, order not created, stock unchanged | | |
| ORDER-01 🖥️ | Place a COD order | Full checkout flow with valid address | Order created, redirected to order details, cart emptied | | |
| ORDER-02 📮 | Totals computed server-side | Attempt to send a custom `totalAmount` in `POST /api/orders` body | Server ignores it; `totalAmount` matches DB prices | | |
| ORDER-03 🖥️ | Order history restricted to owner | Log in as User A, note an order ID; log in as User B; `GET /api/orders/:id` for A's order with B's token | `403 Forbidden` | | |
| ORDER-04 🖥️ | Order history displays correctly | Visit `/my-orders` | List of this user's orders only, correct totals/dates | | |

## C2. Online Payment (Razorpay, test mode)

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| PAY-01 🖥️ | Successful online payment | At checkout select "Pay Online", use test card `4111 1111 1111 1111` | Razorpay widget completes, redirected to order details, `paymentStatus: Paid`, `paymentMethod: Online` | | |
| PAY-02 🖥️ | Cancelled payment doesn't create an order | Open "Pay Online", close the Razorpay widget without paying | No order appears in `/my-orders`; cart is untouched; stock unchanged | | |
| PAY-03 🖥️ | Simulated failed payment | Use UPI id `failure@razorpay` in the widget | Widget reports failure; no order created; user can retry | | |
| PAY-04 📮 | Reject forged signature | `POST /api/payments/razorpay/verify` with a made-up `razorpay_signature` | `400 Bad Request`, "invalid signature"; no order created | | |
| PAY-05 📮 | Reject payment order creation with empty cart | Empty the cart, then `POST /api/payments/razorpay/order` | `400 Bad Request`, "cart is empty" | | |
| PAY-06 🖥️ | COD still works unaffected | Checkout with "Cash on Delivery" selected | Order created immediately with `paymentMethod: COD`, `paymentStatus: Pending` | | |
| PAY-07 📮 | Payment routes require authentication | `POST /api/payments/razorpay/order` with no token | `401 Unauthorized` | | |

## C3. Order Invoice (PDF)

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| INV-01 🖥️ | Download invoice as customer | On an order you own, click "Download Invoice" | A `invoice-XXXXXXXX.pdf` file downloads with correct items, totals, address and payment info | | |
| INV-02 🖥️ | Download invoice as admin | On `/admin/orders/:id`, click "Download Invoice" | Same PDF downloads, including customer name/email | | |
| INV-03 📮 | Reject unauthenticated invoice request | `GET /api/orders/:id/invoice` with no token | `401 Unauthorized` | | |
| INV-04 📮 | Reject another customer's invoice | Log in as User B, request `GET /api/orders/:id/invoice` for User A's order | `403 Forbidden` | | |
| INV-05 📮 | Reject invalid order id | `GET /api/orders/not-a-valid-id/invoice` | `400 Bad Request` | | |
| INV-06 🖥️ | Invoice totals match order | Compare PDF totals/line items against the order details page | Amounts match exactly | | |

## D. Admin

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| ADMIN-01 🖥️ | Admin dashboard stats | Log in as admin, visit `/admin` | Correct counts for products/orders/customers/revenue | | |
| ADMIN-02 🖥️ | Create/edit/delete product | Use `/admin/products` forms | Product list updates correctly; delete deactivates if referenced by an order | | |
| ADMIN-03 🖥️ | Manage categories | Use `/admin/categories` | Create/edit/deactivate works; deleting a category with products deactivates it instead | | |
| ADMIN-04 🖥️ | Update order status | `/admin/orders`, change a status | Status updates, invalid transitions are not offered | | |
| ADMIN-05 📮 | Customer cannot reach admin APIs | Any `/api/admin/*` or admin-only product/category/order route, with a **customer** token | `403 Forbidden` on every one | | |
| ADMIN-06 🖥️ | Customer cannot reach admin UI via URL | Log in as customer, navigate to `/admin` directly | Redirected away (frontend) **and** underlying API calls return 403 (backend) | | |

## D2. About Us / Contact

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| STATIC-01 🖥️ | About Us page renders | Visit `/about` | Page content displays, no console errors | | |
| STATIC-02 🖥️ | Contact form submits successfully | Fill valid name/email/subject/message on `/contact`, submit | Success message shown, form clears, a `ContactMessage` document appears in MongoDB | | |
| STATIC-03 🖥️ | Contact form validation | Submit with an invalid email or a message under 10 characters | Inline field errors shown, no request sent | | |
| STATIC-04 📮 | Contact rate limiting | Submit the contact form 11+ times within 15 minutes from the same IP | 11th+ request returns `429`-style rate-limit message | | |
| STATIC-05 📮 | Admin-only message inbox | `GET /api/contact` with a customer token vs an admin token | Customer gets `403`; admin gets the paginated message list | | |
| STATIC-06 🖥️ | Admin can view messages | Log in as admin, visit `/admin/messages` | List of submitted contact messages, newest first, unresolved ones marked | | |
| STATIC-07 🖥️ | Admin can expand a message | Click a message row | Full message body expands inline | | |
| STATIC-08 🖥️ | Admin can mark resolved/unresolved | Click "Mark as Resolved" on a message, then "Mark as Unresolved" | Status badge and dashboard "Unresolved Messages" count update accordingly | | |
| STATIC-09 🖥️ | Admin can delete a message | Click delete, confirm | Message removed from the list (and from the DB) | | |
| STATIC-10 📮 | Non-admin cannot resolve/delete messages | `PATCH /api/contact/:id/resolve` or `DELETE /api/contact/:id` with a customer token | `403 Forbidden` on both | | |

## C4. Categories & Subcategories

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| CAT-01 🖥️ | Create a subcategory | In `/admin/categories`, click + on a top-level category, add "Men" under "Clothing" | "Men" appears indented under "Clothing" | | |
| CAT-02 📮 | Reject nesting a subcategory under a subcategory | `POST /api/categories` with `parentCategory` set to an existing subcategory's id | `400 Bad Request` | | |
| CAT-03 🖥️ | Filtering by parent includes subcategory products | Add a product under "Clothing → Men", filter `/products` by "Clothing" | The Men's product appears in results | | |
| CAT-04 📮 | Reject making a category with children into a subcategory | `PUT /api/categories/:id` setting `parentCategory` on a category that already has its own subcategories | `400 Bad Request` | | |
| CAT-05 🖥️ | Deleting a category with subcategories deactivates it | Delete a top-level category that has subcategories | Category deactivated, not deleted; subcategories untouched | | |

## C5. Wishlist

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| WISH-01 🖥️ | Add to wishlist | Click the heart icon on a product card (logged in) | Heart fills in, product appears on `/wishlist` | | |
| WISH-02 🖥️ | Remove from wishlist | Click the filled heart again, or remove from `/wishlist` page | Product disappears from wishlist | | |
| WISH-03 🖥️ | Wishlist requires login | Click the heart icon while logged out | Prompted to log in; nothing is saved | | |
| WISH-04 📮 | Wishlist is per-user | Log in as User A, add a product; log in as User B | User B's `GET /api/wishlist` does not show User A's saved item | | |
| WISH-05 🖥️ | Wishlist survives a deleted product gracefully | Wishlist a product, have an admin delete it (hard delete, no orders reference it) | Wishlist page simply omits the deleted product, no crash | | |

## C6. Reviews & Ratings

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| REV-01 🖥️ | Submit a review | On a product details page, submit a rating + comment | Review appears in the list; product's star rating updates | | |
| REV-02 🖥️ | Edit own review | Submit a review again for the same product with a different rating | Existing review updates in place (no duplicate) | | |
| REV-03 📮 | Duplicate review prevented at DB level | Attempt to directly insert two reviews for the same user+product | Second insert fails the unique index | | |
| REV-04 🖥️ | Verified Purchase badge | Review a product you have a `Delivered` order for, vs. one you don't | Badge shown only for the delivered-purchase product | | |
| REV-05 🖥️ | Delete own review | Click delete on your own review | Review removed, rating average recalculates | | |
| REV-06 📮 | Cannot delete another user's review | `DELETE /api/products/:id/reviews/:reviewId` for someone else's review, as a non-admin | `403 Forbidden` | | |
| REV-07 📮 | Reject invalid rating | Submit a review with `rating: 6` or `rating: 0` | `400 Bad Request` | | |

## C7. Notifications

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| NOTIF-01 🖥️ | Order-placed notification | Place an order (COD or online) | A notification appears in the bell within ~30s, linking to the order | | |
| NOTIF-02 🖥️ | Order-status notification | As admin, change an order's status | The customer's bell shows a new "status updated" notification | | |
| NOTIF-03 🖥️ | Mark as read | Click a notification | It's marked read; unread count decreases | | |
| NOTIF-04 🖥️ | Mark all as read | Click "Mark all read" | All notifications marked read, badge disappears | | |
| NOTIF-05 📮 | Notifications are per-user | Log in as User A and User B separately | Each only sees their own notifications | | |
| NOTIF-06 🖥️ | Email notification (optional) | Configure SMTP in `.env`, place an order | An email arrives at the test inbox with order details | | |
| NOTIF-07 🖥️ | Missing SMTP config doesn't break orders | Leave SMTP vars unset, place an order | Order still succeeds; in-app notification still appears; server logs one warning | | |

## E. Business Logic / Security Edge Cases

| ID | Description | Input | Expected Result | Actual Result | Pass/Fail |
|----|---|---|---|---|---|
| SEC-01 📮 | Reject price override attempt | `PATCH /api/cart/items/:id` or order creation with a forged price field | Server ignores client-sent price, uses DB price | | |
| SEC-02 🖥️/📮 | Cancellation restores stock exactly once | Place an order, note product stock, cancel order as admin, re-send the same cancel PATCH request | Stock increases once only; second cancel attempt is rejected (invalid transition, already `Cancelled`) | | |
| SEC-03 📮 | Invalid order-status transition rejected | `PATCH /api/orders/:id/status` with `status: "Delivered"` on a freshly `Placed` order | `400 Bad Request` | | |
| SEC-04 🖥️ | Mobile responsiveness | Resize browser to ~375px width (or use DevTools device mode) | Navbar collapses to menu, product grid reflows, tables scroll horizontally | | |
| SEC-05 🖥️ | Empty states | Search for a nonsense term; view cart with 0 items; view orders with none placed | Friendly empty-state messages, no raw errors or blank screens | | |
| SEC-06 📮 | Duplicate category name rejected | `POST /api/categories` with a name that already exists | `409 Conflict` | | |

---

## How to Run the 📮 Tests

With the backend running on port 5000, you can test most endpoints directly with `curl`, e.g.:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login (copy the returned token for authenticated requests)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Authenticated request
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer <TOKEN>"
```

Or import the routes above into Postman as a collection, setting a collection variable `{{token}}`
you update after login.

---

## Reporting

For your submission, copy this table (or export it) with every **Actual Result** and **Pass/Fail**
filled in from real runs. Note any failing tests and whether they were fixed and re-tested.
