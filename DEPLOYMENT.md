# Deployment Guide — Netlify (frontend) + Render (backend)

This splits the app the way each platform is actually built for: Netlify serves the static React
build and handles client-side routing; Render runs the persistent Express + MongoDB server
(sessions, Mongoose connections, and multi-document transactions all need a long-running process,
which Netlify's serverless functions aren't well suited for — see the note at the bottom).

You'll end up with two URLs, e.g.:
- Frontend: `https://your-site.netlify.app`
- Backend: `https://mca-ecommerce-api.onrender.com`

Deploy the backend first — the frontend needs its URL.

---

## Part 1 — Push your code to GitHub

Both Netlify and Render deploy from a Git repository.

```bash
cd mca-ecommerce
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on GitHub, then:
```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

Double-check `.env` is **not** committed (it's in `.gitignore` in both `server/` and `client/`) —
only `.env.example` should be in the repo.

---

## Part 2 — Deploy the backend to Render

1. Sign up free at https://render.com (you can sign in with GitHub).
2. Click **New +** → **Web Service**, and connect your GitHub repo.
   - If you committed the `render.yaml` at the repo root, Render will offer **New +** → **Blueprint**
     instead, which pre-fills most of this for you — pick whichever option Render shows you.
3. Configure the service:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Under **Environment**, add these variables (values from your own setup — see the main
   `README.md` for how to get a `MONGO_URI` and Razorpay test keys):

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your MongoDB Atlas connection string |
   | `JWT_SECRET` | a long random string |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://your-site.netlify.app` (set this after Part 3, then redeploy) |
   | `RAZORPAY_KEY_ID` | your Razorpay test key id (optional) |
   | `RAZORPAY_KEY_SECRET` | your Razorpay test key secret (optional) |

5. Click **Create Web Service**. Render will build and deploy; watch the logs for
   `MongoDB connected: ...` and `Server running on http://localhost:<port>` — Render handles the
   public URL/port mapping for you automatically (it sets `PORT` itself; your `server.js` already
   reads `process.env.PORT`, so no code change needed).
6. **Important — MongoDB Atlas network access:** Render's outbound IPs aren't fixed on the free
   tier, so in Atlas's **Network Access**, either add `0.0.0.0/0` (allow from anywhere — fine for a
   college demo, not for a real production app) or use Atlas's "allow access from anywhere for
   Render" guidance if your Atlas plan supports more granular rules.
7. Confirm it works: visit `https://<your-render-url>/api/health` — you should see
   `{"success":true,"message":"API is running"}`.
8. Seed the database and create an admin **once**, from your own machine, pointed at the production
   database (reuse the same `MONGO_URI` locally for this one-off step):
   ```bash
   cd server
   MONGO_URI="<your atlas uri>" npm run seed
   MONGO_URI="<your atlas uri>" npm run create-admin
   ```

---

## Part 3 — Deploy the frontend to Netlify

1. Sign up free at https://netlify.com (GitHub sign-in works).
2. Click **Add new site** → **Import an existing project**, connect the same GitHub repo.
3. Configure the build:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
   - Netlify will detect the `netlify.toml` inside `client/` and apply its settings (including the
     SPA redirect rule) automatically once the base directory is set correctly.
4. Under **Site configuration → Environment variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-render-url>/api` |
5. Click **Deploy site**. Netlify gives you a URL like `https://random-name-123.netlify.app`
   (you can rename it under **Site configuration → Change site name**).

---

## Part 4 — Connect the two

Go back to Render and update the `CLIENT_URL` environment variable to your real Netlify URL
(`https://your-site.netlify.app`, no trailing slash), then trigger a manual redeploy on Render so
the updated CORS setting takes effect. Without this step, the browser will block API requests from
your Netlify site with a CORS error.

---

## Verifying the deployment

- Visit your Netlify URL, confirm products load (this proves the frontend can reach the backend
  and the backend can reach MongoDB).
- Register an account, log in, add to cart, and place a COD order end-to-end.
- Open browser DevTools → Network tab if anything fails — a CORS error means `CLIENT_URL` on Render
  doesn't match your Netlify URL exactly; a failed fetch to `undefined/api/...` means
  `VITE_API_URL` wasn't set before the Netlify build ran (Vite bakes env vars in at build time, so
  you must **redeploy** after adding/changing one, not just save it).

---

## Why not run the backend on Netlify too?

Netlify *can* run Express via Netlify Functions (wrapping the app with `serverless-http`), but each
invocation is a stateless, isolated function — your Mongoose connection, multi-document order
transactions, and session-like behavior aren't a natural fit without extra work (connection caching
across invocations, shorter function timeouts). Render runs your existing `server.js` exactly as
written, which is simpler and more reliable for this project. If your assignment specifically
requires everything on Netlify, ask and this can be adapted.
