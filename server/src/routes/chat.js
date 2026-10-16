import { Router } from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitTo, onlineIds } from '../realtime.js';
import { bad, isId, U } from '../utils/helpers.js';
const r = Router();
const oid = id => new mongoose.Types.ObjectId(id);
r.get('/online', auth, (req, res) => res.json(onlineIds()));
r.get('/conversations', auth, async (req, res) => {
  const me = oid(req.userId);
  const rows = await Message.aggregate([{ $match: { $or: [{ from: me }, { to: me }] } }, { $sort: { createdAt: -1 } },
    { $group: { _id: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] }, last: { $first: '$$ROOT' }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$read', false] }] }, 1, 0] } } } },
    { $sort: { 'last.createdAt': -1 } }]);
  const users = await User.find({ _id: { $in: rows.map(x => x._id) } }).select(U);
  const m = Object.fromEntries(users.map(u => [String(u._id), u]));
  res.json(rows.filter(x => m[String(x._id)]).map(x => ({ user: m[String(x._id)], last: x.last, unread: x.unread })));
});
r.get('/messages/:id', auth, async (req, res) => {
  const me = req.userId, o = req.params.id; if (!isId(o)) return bad(res, 'Invalid id');
  const n = await Message.updateMany({ from: o, to: me, read: false }, { read: true });
  if (n.modifiedCount) emitTo(o, 'seen', { by: me });
  res.json(await Message.find({ $or: [{ from: me, to: o }, { from: o, to: me }] }).sort('-createdAt').limit(300).then(x => x.reverse()));
});
r.post('/messages/:id', auth, async (req, res) => {
  const { text, image } = req.body; if (!isId(req.params.id)) return bad(res, 'Invalid id');
  if (!text?.trim() && !image) return bad(res, 'Message can\u2019t be empty');
  if (!(await User.exists({ _id: req.params.id }))) return bad(res, 'User not found', 404);
  const m = await Message.create({ from: req.userId, to: req.params.id, text: text?.trim(), image });
  const from = await User.findById(req.userId).select(U);
  emitTo(req.params.id, 'message', { ...m.toObject(), fromUser: from }); res.status(201).json(m);
});
r.get('/unread', auth, async (req, res) => res.json(await Message.aggregate([{ $match: { to: oid(req.userId), read: false } }, { $group: { _id: '$from', n: { $sum: 1 } } }])));
r.get('/notifications', auth, async (req, res) => res.json(await Notification.find({ user: req.userId }).sort('-createdAt').limit(50).populate('from', U)));
r.post('/notifications/read', auth, async (req, res) => { await Notification.updateMany({ user: req.userId }, { read: true }); res.json({ ok: true }); });
export default r;
