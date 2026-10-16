# Deploy the frontend and API to Vercel

The frontend and API must be separate Vercel projects from this GitHub repository. The frontend-only project does not start the Express server, so requests to MongoDB-backed routes such as login and registration fail until the API project is deployed and connected.

## 1. Deploy the API first

In Vercel, create a new project and import `hgitabdullah/kushura-connect`:

- **Root Directory:** `server`
- **Framework Preset:** Express
- **Build Command:** leave the default/blank
- **Install Command:** `npm install` (or `npm ci`)
- **Output Directory:** leave the default/blank

The `server/vercel.json` config selects Express. Add these API project environment variables for Production:

- `MONGODB_URI`: a MongoDB Atlas connection string that includes the database name.
- `JWT_SECRET`: a newly generated, long random secret.
- `CLIENT_URL`: the exact origin of the Vercel frontend, for example `https://your-site.vercel.app`.
- `NODE_ENV`: `production`.

Deploy it, then visit `https://YOUR-API-PROJECT.vercel.app/api/health`. It must return `{ "ok": true }`. If it does not, inspect the API project's runtime logs and confirm Atlas network access permits the API connection.

## 2. Deploy the frontend

Use the existing frontend project, or create another project from the same repository:

- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Install Command:** `npm ci`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Set `VITE_API_URL` in the frontend project's Production environment variables to the API project's origin only, with no `/api` suffix and no trailing slash. Example: `https://your-api-project.vercel.app`.

Redeploy the frontend after saving the variable. Vite embeds it into the production bundle. The API `CLIENT_URL` must exactly match the frontend's production origin. If you use a custom domain, update `CLIENT_URL` and redeploy the API too.

## 3. Verify login and registration

1. Confirm the API health endpoint responds with `{ "ok": true }`.
2. Open the frontend and try registration or login.
3. In browser Developer Tools → Network, confirm `/api/auth/register` or `/api/auth/login` is sent to the API project's domain and returns JSON.
4. If the browser reports a CORS error, correct `CLIENT_URL` on the API project and redeploy it. If the API returns a MongoDB error, inspect its runtime logs and check the Atlas connection string and network access list.

The backend currently writes uploaded files to its local filesystem. Those files are not durable across serverless deployments; use object storage for persistent profile photos and post uploads. Keep secrets in Vercel environment variables, never in GitHub or a committed `.env` file.
