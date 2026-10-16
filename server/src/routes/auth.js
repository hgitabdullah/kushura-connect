import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const r = Router();
const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
r.post('/register', async (req, res) => {
  const name = req.body.name?.trim(), email = req.body.email?.trim().toLowerCase(), { password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (!emailRe.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already used' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: { _id: u._id, name, email } });
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim() }).select('+password');
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password))) return res.status(400).json({ error: 'Wrong email or password' });
  if (u.suspended) return res.status(403).json({ error: 'This account is suspended. Contact support.' });
  res.json({ token: sign(u), user: { _id: u._id, name: u.name, email: u.email, role: u.role || 'user' } });
});
export default r;
