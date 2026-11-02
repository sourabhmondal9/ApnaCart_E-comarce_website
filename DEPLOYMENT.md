# ShopCom Deployment Guide — Render

This guide deploys **both the React frontend and the Express API on Render**. The frontend is a
Render **Static Site**; the backend is a Render **Web Service**. MongoDB Atlas provides the database.

After deployment, you will have two URLs:
- **ShopCom website:** `https://<your-frontend-name>.onrender.com`
- **ShopCom API:** `https://<your-backend-name>.onrender.com`

Deploy the backend first. The frontend needs the backend URL to build correctly.

## 1. Prepare and push the project to GitHub

From the project root, run:

```bash
git status
git add .
git commit -m "Prepare ShopCom for Render deployment"
git push origin main
```

If Git is not initialized or a remote has not been configured, set those up before pushing. Do not commit
real `.env` files, database credentials, JWT secrets, or payment secrets. Commit `.env.example` files only.

Expected structure:

```text
project-root/
├── server/       # Express API
├── client/       # React + Vite frontend
├── README.md
├── DEPLOYMENT.md
└── TESTING.md
```

## 2. Prepare MongoDB Atlas

1. Open [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create or select your cluster.
2. Under **Database Access**, create a database user and password.
3. Under **Network Access**, configure access for your Render service. Render's outbound IP addresses may vary,
   especially on free instances. Atlas may require `0.0.0.0/0` for a simple student demo; this permits
   connections from any IP and is less restrictive, so use a strong database password and do not treat it
   as a production security configuration.
4. Copy the Atlas driver connection string. Replace the username, password, and database name as required.
5. Keep the connection string private. It will be entered into Render's environment settings, not committed
   to Git.

Example format:

```text
mongodb+srv://<username>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
```

If the password contains special characters, URL-encode them in the connection string.

## 3. Deploy the backend API on Render

1. Sign in at [Render](https://render.com) and select **New + → Web Service**.
2. Connect the GitHub repository that contains ShopCom.
3. Configure the service:

   | Setting | Value |
   |---|---|
   | Name | `shopcom-api` (or another available name) |
   | Root Directory | `server` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Choose the plan you want to use |

4. In the service's **Environment** settings, add the variables below. Use your actual secret values.

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A long, random secret |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | Leave as a temporary placeholder until the frontend URL exists; then set it to the exact frontend origin |
   | `RAZORPAY_KEY_ID` | Optional Razorpay test key ID |
   | `RAZORPAY_KEY_SECRET` | Optional Razorpay test key secret |

   Do not set `PORT` manually unless your application specifically requires it. Render supplies `PORT`; the
   server should listen on `process.env.PORT`.

5. Select **Create Web Service** and wait for the build and deployment to finish.
6. Review the Render logs. Resolve any missing environment variables, install errors, or MongoDB connection
   errors before continuing.
7. Test the health endpoint by opening:

   `https://<your-backend-name>.onrender.com/api/health`

   The expected response is:

   ```json
   {"success":true,"message":"API is running"}
   ```

### Seed the production database and create an administrator

Run these one-off commands from your own computer, using the production Atlas connection string. Do this only
after confirming the backend and database are configured correctly.

```bash
cd server
```

In PowerShell, set the connection string for the current terminal session:

```powershell
$env:MONGO_URI="your_mongodb_atlas_connection_string"
npm run seed
npm run create-admin
```

In macOS/Linux shells:

```bash
MONGO_URI="your_mongodb_atlas_connection_string" npm run seed
MONGO_URI="your_mongodb_atlas_connection_string" npm run create-admin
```

The seed script populates sample products. The admin script creates or promotes the administrator account
according to the script's behavior. Use a strong admin password and do not share it.

## 4. Deploy the frontend on Render

1. In Render, select **New + → Static Site**.
2. Connect the same GitHub repository.
3. Configure the static site:

   | Setting | Value |
   |---|---|
   | Name | `shopcom` (or another available name) |
   | Root Directory | `client` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

4. Add the frontend environment variable before deploying:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-backend-name>.onrender.com/api` |

   Replace the example backend hostname with the actual Render Web Service URL. Vite embeds `VITE_` variables
   into the frontend at build time, so the URL must be set before the build.

5. In the Static Site's **Redirects/Rewrites** settings, add a rewrite for client-side routing:

   | Source | Destination | Action |
   |---|---|---|
   | `/*` | `/index.html` | `Rewrite` (HTTP 200) |

   This allows React Router URLs such as `/products`, `/cart`, and `/my-orders` to load when opened directly.
   If the Render dashboard provides a different form for rewrite rules, configure the equivalent catch-all
   rewrite to `/index.html` with status `200`, not a permanent redirect.

6. Deploy the static site and copy its public `onrender.com` URL.

## 5. Connect frontend and backend (CORS)

1. Open the backend Web Service in Render.
2. Set `CLIENT_URL` to the exact frontend origin, for example:

   `https://shopcom.onrender.com`

   Do not add a path such as `/products` or a trailing slash.
3. Save the environment variable and trigger a new deployment if Render does not redeploy automatically.
4. Confirm the frontend's `VITE_API_URL` points to the backend URL followed by `/api`. If you change it, trigger
   a new frontend deployment because Vite variables are embedded at build time.

The two values serve different purposes:
- `VITE_API_URL` tells the browser where the API is located.
- `CLIENT_URL` tells the backend which frontend origin is allowed by CORS.

## 6. Verify the deployed ShopCom website

Test the deployed website in a browser:

- Open the frontend URL and confirm the page loads with the ShopCom name.
- Open the products page and confirm products load from MongoDB.
- Register a customer and sign in.
- Search and filter products, add an item to the cart, and update its quantity.
- Place a Cash on Delivery order and confirm it appears in order history.
- If Razorpay test mode is configured, test the online payment flow with test credentials only.
- Sign in as an administrator and test product, category, and order management.
- Open a nested URL directly, such as `/products`, and refresh it to verify the static-site rewrite.
- Test the site on a mobile-sized viewport.

If something fails, open browser DevTools → **Network** and check the Render service logs.

| Symptom | Likely cause / action |
|---|---|
| Browser reports a CORS error | Check `CLIENT_URL` matches the frontend origin exactly, then redeploy the backend. |
| Request goes to `undefined/api/...` | Set `VITE_API_URL` in the Render Static Site and redeploy the frontend. |
| API returns a database connection error | Check `MONGO_URI`, Atlas database credentials, and Atlas Network Access. |
| Direct refresh of a React route returns 404 | Add or correct the `/*` → `/index.html` rewrite with HTTP 200. |
| First API request is slow | A free Web Service may have been suspended while idle and need time to start again. |

## 7. Deployment and security notes

- Keep secrets in Render environment variables. Never put `MONGO_URI`, `JWT_SECRET`, or `RAZORPAY_KEY_SECRET`
  in frontend variables or commit them to Git.
- `VITE_` variables are public in the browser bundle. Only put non-secret configuration, such as the API URL,
  in `VITE_API_URL`.
- Use Razorpay **test mode** until the payment integration has been verified. Never use test keys for live
  payments or expose the key secret to the frontend.
- Free Render services may sleep when idle and can have cold-start delays. Check Render's current plan details
  for the limits that apply to your account.
- A successful deployment does not prove every feature works. Complete the manual checks in `TESTING.md`
  and record actual results before presenting them as passed.
