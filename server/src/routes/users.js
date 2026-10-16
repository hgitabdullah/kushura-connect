import { Router } from 'express';
import bcrypt from 'bcryptjs';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Listing from '../models/Listing.js';
import Group from '../models/Group.js';
import Page from '../models/Page.js';
import { notify } from '../realtime.js';
import { bad, clean, isId, POST_POP, U, canSee } from '../utils/helpers.js';
import { deleteUserData } from '../utils/deleteUser.js';
const r = Router();
const esc = s => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PROFILE = ['name', 'bio', 'avatar', 'cover', 'work', 'education', 'location', 'hometown', 'relationship', 'website', 'birthday'];
r.param('id', (req, res, next, id) => isId(id) ? next() : bad(res, 'Invalid id'));

r.get('/', auth, async (req, res) => res.json(await User.find({ name: new RegExp(esc(req.query.q), 'i'), _id: { $ne: req.userId }, discoverable: { $ne: false } }).select(U).limit(20)));
r.get('/me', auth, async (req, res) => {
  const me = await User.findById(req.userId).populate('friends requests', U);
  if (!me) return bad(res, 'User not found', 401);
  const sent = await User.find({ requests: req.userId }).select(U);
  res.json({ ...me.toObject(), sent });
});
r.put('/me', auth, async (req, res) => {
  const u = clean(req.body, PROFILE);
  if (u.name === '') return bad(res, 'Name required');
  res.json(await User.findByIdAndUpdate(req.userId, u, { new: true, runValidators: true }));
});
r.put('/me/preferences', auth, async (req, res) => {
  const patch = {};
  for (const key of ['discoverable', 'allowFriendRequests']) {
    if (req.body[key] !== undefined) {
      if (typeof req.body[key] !== 'boolean') return bad(res, `${key} must be true or false`);
      patch[key] = req.body[key];
    }
  }
  if (req.body.profileVisibility !== undefined) {
    if (!['everyone', 'friends'].includes(req.body.profileVisibility)) return bad(res, 'Invalid profile visibility');
    patch.profileVisibility = req.body.profileVisibility;
  }
  if (req.body.notificationPreferences !== undefined) {
    const prefs = req.body.notificationPreferences;
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) return bad(res, 'Invalid notification preferences');
    for (const key of ['friendRequests', 'postActivity', 'communityActivity']) {
      if (prefs[key] !== undefined) {
        if (typeof prefs[key] !== 'boolean') return bad(res, `notificationPreferences.${key} must be true or false`);
        patch[`notificationPreferences.${key}`] = prefs[key];
      }
    }
  }
  const user = await User.findByIdAndUpdate(req.userId, { $set: patch }, { new: true, runValidators: true });
  res.json({ profileVisibility: user.profileVisibility, discoverable: user.discoverable, allowFriendRequests: user.allowFriendRequests, notificationPreferences: user.notificationPreferences });
});
r.get('/me/export', auth, async (req, res) => {
  const id = req.userId;
  const [profile, posts, stories, messages, notifications, listings, groups, pages] = await Promise.all([
    User.findById(id), Post.find({ author: id }).lean(), Story.find({ author: id }).lean(),
    Message.find({ $or: [{ from: id }, { to: id }] }).lean(), Notification.find({ user: id }).lean(),
    Listing.find({ seller: id }).lean(), Group.find({ $or: [{ owner: id }, { members: id }] }).lean(),
    Page.find({ $or: [{ owner: id }, { followers: id }] }).lean(),
  ]);
  res.setHeader('Content-Disposition', 'attachment; filename="kushuraconnect-account-data.json"');
  res.json({ exportedAt: new Date().toISOString(), profile: profile?.toObject(), posts, stories, messages, notifications, listings, groups, pages });
});
r.put('/me/account', auth, async (req, res) => {
  const me = await User.findById(req.userId).select('+password');
  const { name, email, currentPassword, newPassword } = req.body;
  if (!(await bcrypt.compare(String(currentPassword || ''), me.password))) return bad(res, 'Current password is incorrect');
  if (name !== undefined) { if (!name.trim()) return bad(res, 'Name required'); me.name = name.trim(); }
  if (email && email.toLowerCase() !== me.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Invalid email');
    if (await User.exists({ email: email.toLowerCase() })) return bad(res, 'Email already used');
    me.email = email.toLowerCase();
  }
  if (newPassword) { if (newPassword.length < 6) return bad(res, 'Password must be at least 6 characters'); me.password = await bcrypt.hash(newPassword, 10); }
  await me.save(); res.json({ ok: true, name: me.name, email: me.email });
});
r.delete('/me', auth, async (req, res) => {
  const me = await User.findById(req.userId).select('+password');
  if (!(await bcrypt.compare(String(req.body?.password || ''), me.password))) return bad(res, 'Password is incorrect');
  if (me.role === 'admin' && await User.countDocuments({ role: 'admin', suspended: { $ne: true } }) <= 1) return bad(res, 'Transfer admin access before deleting the last active admin account', 400);
  await deleteUserData(me._id); res.json({ ok: true });
});
r.get('/me/saved', auth, async (req, res) => {
  const me = await User.findById(req.userId);
  const posts = await Post.find({ _id: { $in: me.saved } }).populate(POST_POP);
  res.json(posts.filter(p => canSee(p, me._id, me.friends)));
});
r.get('/suggestions', auth, async (req, res) => {
  const me = await User.findById(req.userId).populate('friends', 'friends');
  const mine = new Set([...me.friends.map(f => String(f._id)), String(me._id), ...me.requests.map(String)]);
  const sent = (await User.find({ requests: me._id }).select('_id')).map(u => String(u._id));
  const counts = {};
  for (const f of me.friends) for (const ff of f.friends) { const k = String(ff); if (!mine.has(k) && !sent.includes(k)) counts[k] = (counts[k] || 0) + 1; }
  let ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 20);
  if (ids.length < 8) { const more = await User.find({ _id: { $nin: [...mine, ...sent, ...ids] }, discoverable: { $ne: false } }).select('_id').limit(8 - ids.length); ids.push(...more.map(m => String(m._id))); }
  const users = await User.find({ _id: { $in: ids }, discoverable: { $ne: false } }).select(U);
  res.json(users.map(u => ({ ...u.toObject(), mutual: counts[String(u._id)] || 0 })).sort((a, b) => b.mutual - a.mutual));
});
r.get('/:id', auth, async (req, res) => {
  const u = await User.findById(req.params.id).populate('friends', U);
  if (!u) return bad(res, 'User not found', 404);
  const me = await User.findById(req.userId);
  const isFriend = me.friends.map(String).includes(String(u._id));
  if (String(u._id) !== req.userId && u.profileVisibility === 'friends' && !isFriend) return res.status(403).json({ error: 'This profile is visible to friends only', private: true });
  const mutual = u.friends.filter(f => me.friends.map(String).includes(String(f._id)));
  const status = String(u._id) === req.userId ? 'self' : isFriend ? 'friends'
    : u.requests.map(String).includes(req.userId) ? 'sent' : me.requests.map(String).includes(String(u._id)) ? 'received' : 'none';
  const o = u.toObject(); delete o.requests; delete o.saved;
  res.json({ ...o, mutualCount: mutual.length, mutual: mutual.slice(0, 6), status });
});
r.get('/:id/photos', auth, async (req, res) => {
  const me = await User.findById(req.userId); const u = await User.findById(req.params.id);
  const isFriend = u?.friends.map(String).includes(req.userId);
  if (u?.profileVisibility === 'friends' && String(u._id) !== req.userId && !isFriend) return res.json([]);
  const posts = await Post.find({ author: req.params.id, group: null, page: null }).sort('-createdAt');
  const photos = posts.filter(p => canSee(p, me._id, me.friends)).flatMap(p => [...(p.images || []), ...(p.image ? [p.image] : [])].map(src => ({ src, post: p._id })));
  if (u?.avatar) photos.push({ src: u.avatar }); if (u?.cover) photos.push({ src: u.cover });
  res.json(photos);
});
r.post('/:id/request', auth, async (req, res) => {
  const id = req.params.id;
  if (id === req.userId) return bad(res, "Can't add yourself");
  const me = await User.findById(req.userId);
  const target = await User.findById(id).select('allowFriendRequests');
  if (!target) return bad(res, 'User not found', 404);
  if (target.allowFriendRequests === false) return bad(res, 'This person is not accepting friend requests', 403);
  if (me.friends.map(String).includes(id)) return bad(res, 'Already friends');
  if (me.requests.map(String).includes(id)) return bad(res, 'They already sent you a request — accept it instead');
  const t = await User.findByIdAndUpdate(id, { $addToSet: { requests: req.userId } });
  if (!t) return bad(res, 'User not found', 404);
  notify(id, req.userId, 'request', null, { link: `/profile/${req.userId}` }); res.json({ ok: true });
});
r.delete('/:id/request', auth, async (req, res) => { await User.findByIdAndUpdate(req.params.id, { $pull: { requests: req.userId } }); res.json({ ok: true }); });
r.post('/:id/accept', auth, async (req, res) => {
  const me = await User.findById(req.userId);
  if (!me.requests.map(String).includes(req.params.id)) return bad(res, 'No request from this user');
  await User.findByIdAndUpdate(req.userId, { $pull: { requests: req.params.id }, $addToSet: { friends: req.params.id } });
  await User.findByIdAndUpdate(req.params.id, { $addToSet: { friends: req.userId }, $pull: { requests: req.userId } });
  notify(req.params.id, req.userId, 'accept', null, { link: `/profile/${req.userId}` }); res.json({ ok: true });
});
r.post('/:id/decline', auth, async (req, res) => { await User.findByIdAndUpdate(req.userId, { $pull: { requests: req.params.id } }); res.json({ ok: true }); });
r.delete('/:id/friend', auth, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { $pull: { friends: req.params.id } });
  await User.findByIdAndUpdate(req.params.id, { $pull: { friends: req.userId } }); res.json({ ok: true });
});
export default r;
