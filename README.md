# KushuraConnect — a community-focused social network

Full-stack social network built with **MongoDB, Express, React (Vite) and Node**, real-time via **Socket.io**.

## Features
- **Auth**: register/login (bcrypt + JWT), validation, demo account.
- **Home**: 3-column layout (shortcuts sidebar · feed · contacts with online status), stories bar, composer, infinite "load more".
- **Posts**: text, multiple images, video, feeling, privacy (Public / Friends / Only me), edit, delete, save/bookmark, share/repost, copy link, single post page.
- **Reactions**: Like, Love, Haha, Wow, Sad, Angry with a hover picker, counts and a "who reacted" list.
- **Comments**: nested replies, comment likes, edit/delete.
- **Stories**: photo or text stories, expire after 24h (TTL index), viewer with progress bars, list of who viewed.
- **Friends**: requests, accept/decline, cancel sent requests, unfriend, suggestions (friends-of-friends with mutual counts).
- **Profiles**: cover/avatar upload, tabs (Posts, About, Friends, Photos), edit profile modal (bio, work, education, city, hometown, relationship, birthday, website).
- **Messenger**: chat list with last message & unread, online list, typing indicator, image messages, emoji picker, seen receipts, mini chat pop-ups from the contacts sidebar.
- **Notifications**: real-time bell + toast for reactions, comments, replies, comment likes, shares, friend requests, group/page activity; click-through to the post/profile/group.
- **Global search**: people, posts, groups, pages, with filters.
- **Groups**: create (public/private), join/leave, group feed, members, promote/remove admins, remove members.
- **Pages**: create, follow/unfollow, page posts (posted as the page).
- **Marketplace**: create listings with photos, browse/search/filter by category, detail page, mark sold, message the seller.
- **Watch**: video feed.
- **Settings**: change name/email/password, dark mode, delete account.
- **Design**: dark mode, responsive (mobile bottom tab bar), skeleton loaders, empty states, react-icons.
- **Uploads**: multer → `server/uploads`, served at `/uploads` (old data-URL images still work).
- **Security basics**: helmet, input validation, ownership checks, central error handler.

## Run locally
Requires Node 18+.
```bash
cd server && npm install && cp .env.example .env && npm start     # API on :5000
cd client && npm install && npm run dev                             # app on :5173
```
With `MONGODB_URI` (or the legacy `MONGO_URI`) empty the API starts an in-memory MongoDB and seeds demo data (8 users, posts, groups, pages, stories, listings, chats). Data resets on restart.

**Demo login:** `demo@socialbook.com` / `demo123` (all seeded users use password `demo123`, e.g. `sara@socialbook.com`).

### Tests
With the API running: `cd server && npm test` (26 end-to-end checks incl. socket messaging).

## Environment variables (server/.env)
| Var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Empty = in-memory DB; `MONGO_URI` is accepted as a legacy alias |
| `JWT_SECRET` | Secret for signing tokens (**required in production**) |
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Allowed CORS origin (default `*`) |
| `SEED` | `true` to seed demo data into a real DB on boot |
| `NODE_ENV` | `production` makes the API also serve `client/dist` |

## MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com.
2. *Database Access* → add a user with password. *Network Access* → allow your IP (or `0.0.0.0/0` for hosted servers).
3. *Connect → Drivers* → copy the string, e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/socialbook?retryWrites=true&w=majority`.
4. Put it in `server/.env` as `MONGODB_URI=...`. Optionally seed: `npm run seed` (or `npm run seed:reset` to wipe first).

## Admin control room
The `/control-room` page is available to accounts with the `admin` role. The API checks the role on each admin request. Admins can search and paginate through registered accounts, review sign-up dates and account status, promote or demote administrators, suspend or reactivate accounts, and permanently delete accounts with their associated content.

To bootstrap the project administrator, set `ADMIN_BOOTSTRAP_PASSWORD` in the current shell and run `cd server && npm run admin:bootstrap`. The setup script creates or promotes `mdabdullah35363@gmail.com` and stores the password as a bcrypt hash. Do not commit the password or put it in source code.

## Deploy
**Single service (simplest, e.g. Render/Railway/Fly):**
```bash
cd client && npm install && npm run build
cd ../server && npm install && NODE_ENV=production npm start
```
The API serves the built React app and Socket.io on one port. Set `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`.

**Split:** deploy `client/dist` to Vercel/Netlify with a rewrite of `/api/*`, `/uploads/*` and `/socket.io/*` to the API host, and set `CLIENT_URL` on the API.

Note: uploaded files are stored on local disk. On hosts with ephemeral disks, mount a persistent volume at `server/uploads` or swap the upload route for S3/Cloudinary.

## Structure
```
server/src  index.js · realtime.js · seed.js · models/ · routes/ · middleware/ · utils/
server/test api.test.js
client/src  App.jsx · ctx.js · utils.js · components/ · pages/ · style.css
```
