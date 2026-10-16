import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import auth from './routes/auth.js';
import users from './routes/users.js';
import posts from './routes/posts.js';
import chat from './routes/chat.js';
import stories from './routes/stories.js';
import groups from './routes/groups.js';
import pages from './routes/pages.js';
import market from './routes/market.js';
import search from './routes/search.js';
import upload from './routes/upload.js';
import admin from './routes/admin.js';
import { initSocket } from './realtime.js';
import { seed } from './seed.js';
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production. Set it in the backend host environment.');
  process.env.JWT_SECRET = 'dev_secret_change_me';
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*' })); app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { maxAge: '7d' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', auth); app.use('/api/users', users); app.use('/api/posts', posts); app.use('/api/stories', stories);
app.use('/api/groups', groups); app.use('/api/pages', pages); app.use('/api/market', market); app.use('/api/search', search);
app.use('/api/upload', upload); app.use('/api/admin', admin); app.use('/api', chat);
// serve built client in production
const dist = path.join(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') { app.use(express.static(dist)); app.get(/^\/(?!api|uploads|socket\.io).*/, (req, res) => res.sendFile(path.join(dist, 'index.html'))); }
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 50MB)' });
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});
// Accept the standard Atlas variable name and the legacy project name.
let uri = process.env.MONGODB_URI || process.env.MONGO_URI; let memory = false;
if (!uri && process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production. Add your Atlas connection string to the backend host environment.');
if (!uri) { const { MongoMemoryServer } = await import('mongodb-memory-server'); uri = (await MongoMemoryServer.create()).getUri(); memory = true; console.log('Using in-memory MongoDB'); }
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');
} catch (error) {
  console.error('MongoDB connection failed. Check the URI, Atlas IP access list, and outbound TCP access to ports 27015–27017.');
  console.error(error.message);
  process.exit(1);
}
if (memory || process.env.SEED === 'true') await seed();
const port = process.env.PORT || 5000;
const server = http.createServer(app); await initSocket(server);
server.listen(port, () => console.log('API on ' + port));
