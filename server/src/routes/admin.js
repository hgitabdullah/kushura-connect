import { Router } from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import requireAdmin from '../middleware/admin.js';
import User from '../models/User.js';
import { deleteUserData } from '../utils/deleteUser.js';
import { disconnectUser } from '../realtime.js';

const r = Router();
r.use(auth, requireAdmin);
const safeUser = u => ({ _id: u._id, name: u.name, email: u.email, avatar: u.avatar, role: u.role || 'user', suspended: !!u.suspended, suspensionReason: u.suspensionReason || '', suspendedAt: u.suspendedAt || null, createdAt: u.createdAt });
const validId = id => mongoose.isValidObjectId(id);
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

r.get('/summary', async (req, res) => {
  const since = new Date(Date.now() - 7 * 864e5);
  const [total, suspended, admins, newThisWeek, recent] = await Promise.all([
    User.countDocuments(), User.countDocuments({ suspended: true }), User.countDocuments({ role: 'admin', suspended: { $ne: true } }),
    User.countDocuments({ createdAt: { $gte: since } }), User.find().sort('-createdAt').limit(8).select('name email role suspended createdAt avatar'),
  ]);
  res.json({ total, suspended, admins, newThisWeek, recent: recent.map(safeUser) });
});

r.get('/users', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const q = String(req.query.q || '').trim().slice(0, 100);
  const filter = q ? { $or: [{ name: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }] } : {};
  if (req.query.status === 'suspended') filter.suspended = true;
  if (req.query.status === 'active') filter.suspended = { $ne: true };
  if (req.query.role === 'admin') filter.role = 'admin';
  if (req.query.role === 'user') filter.role = { $ne: 'admin' };
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).select('name email role suspended suspensionReason suspendedAt createdAt avatar'),
    User.countDocuments(filter),
  ]);
  res.json({ users: users.map(safeUser), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

r.patch('/users/:id/suspension', async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
  if (id === req.userId) return res.status(400).json({ error: 'You cannot suspend your own account' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const suspended = req.body.suspended === true;
  if (suspended && user.role === 'admin' && await User.countDocuments({ role: 'admin', suspended: { $ne: true } }) <= 1) return res.status(400).json({ error: 'You cannot suspend the last active admin' });
  user.suspended = suspended;
  user.suspensionReason = suspended ? String(req.body.reason || '').trim().slice(0, 300) : undefined;
  user.suspendedAt = suspended ? new Date() : undefined;
  await user.save();
  if (suspended) disconnectUser(user._id);
  res.json(safeUser(user));
});

r.patch('/users/:id/role', async (req, res) => {
  const { id } = req.params, role = req.body.role;
  if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
  if (id === req.userId) return res.status(400).json({ error: 'You cannot change your own admin role' });
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be user or admin' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (role === 'user' && user.role === 'admin' && await User.countDocuments({ role: 'admin', suspended: { $ne: true } }) <= 1) return res.status(400).json({ error: 'You cannot remove the last active admin' });
  user.role = role; await user.save();
  res.json(safeUser(user));
});

r.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
  if (id === req.userId) return res.status(400).json({ error: 'Use account settings to delete your own account' });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin' && await User.countDocuments({ role: 'admin', suspended: { $ne: true } }) <= 1) return res.status(400).json({ error: 'You cannot delete the last active admin' });
  await deleteUserData(user._id);
  res.json({ ok: true });
});

export default r;
