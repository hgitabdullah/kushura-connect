import { Router } from 'express';
import auth from '../middleware/auth.js';
import Story from '../models/Story.js';
import User from '../models/User.js';
import { bad, isId, U } from '../utils/helpers.js';
const r = Router();
r.get('/', auth, async (req, res) => {
  const me = await User.findById(req.userId);
  const list = await Story.find({ author: { $in: [...me.friends, me._id] }, expiresAt: { $gt: new Date() } }).sort('createdAt').populate('author', U).populate('viewers', U);
  const groups = {};
  for (const s of list) { const k = String(s.author._id); (groups[k] ||= { user: s.author, stories: [] }).stories.push(s); }
  const arr = Object.values(groups).map(g => ({ ...g, seen: g.stories.every(s => s.viewers.some(v => String(v._id) === req.userId)) }));
  arr.sort((a, b) => (String(b.user._id) === req.userId) - (String(a.user._id) === req.userId) || a.seen - b.seen);
  res.json(arr.map(g => ({ ...g, stories: g.stories.map(s => { const o = s.toObject(); if (String(s.author._id) !== req.userId) delete o.viewers; return o; }) })));
});
r.post('/', auth, async (req, res) => {
  const { image, text, bg } = req.body; if (!image && !text?.trim()) return bad(res, 'Add a photo or text');
  res.status(201).json(await (await Story.create({ author: req.userId, image, text: text?.trim(), bg: bg || '#1877f2' })).populate('author', U));
});
r.post('/:id/view', auth, async (req, res) => { if (!isId(req.params.id)) return bad(res, 'Invalid id'); await Story.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: req.userId } }); res.json({ ok: true }); });
r.delete('/:id', auth, async (req, res) => { await Story.deleteOne({ _id: req.params.id, author: req.userId }); res.json({ ok: true }); });
export default r;
