import { Router } from 'express';
import auth from '../middleware/auth.js';
import Post, { REACTIONS } from '../models/Post.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Page from '../models/Page.js';
import { notify } from '../realtime.js';
import { bad, canSee, isId, POST_POP } from '../utils/helpers.js';
const r = Router();
r.param('id', (req, res, next, id) => isId(id) ? next() : bad(res, 'Invalid id'));
const one = id => Post.findById(id).populate(POST_POP);
const link = p => `/post/${p._id}`;
async function ctx(req) { return User.findById(req.userId); }
const lim = req => Math.min(+req.query.limit || 20, 50), skip = req => Math.max(+req.query.skip || 0, 0);

r.get('/feed', auth, async (req, res) => {
  const me = await ctx(req);
  const groups = (await Group.find({ members: me._id }).select('_id')).map(g => g._id);
  const pages = (await Page.find({ followers: me._id }).select('_id')).map(p => p._id);
  const q = { $or: [
    { author: me._id, group: null, page: null },
    { author: { $in: me.friends }, privacy: { $in: ['public', 'friends'] }, group: null, page: null },
    { privacy: 'public', group: null, page: null },
    { group: { $in: groups } }, { page: { $in: pages } }] };
  res.json(await Post.find(q).sort('-createdAt').skip(skip(req)).limit(lim(req)).populate(POST_POP));
});
r.get('/videos', auth, async (req, res) => {
  const me = await ctx(req);
  const posts = await Post.find({ video: { $nin: [null, ''] } }).sort('-createdAt').limit(50).populate(POST_POP);
  res.json(posts.filter(p => canSee(p, me._id, me.friends)));
});
r.get('/user/:id', auth, async (req, res) => {
  const me = await ctx(req);
  const owner = await User.findById(req.params.id).select('profileVisibility friends');
  const isFriend = owner?.friends.map(String).includes(req.userId);
  if (owner?.profileVisibility === 'friends' && String(owner._id) !== req.userId && !isFriend) return bad(res, 'This profile is visible to friends only', 404);
  const posts = await Post.find({ author: req.params.id, group: null, page: null }).sort('-createdAt').skip(skip(req)).limit(lim(req)).populate(POST_POP);
  res.json(posts.filter(p => canSee(p, me._id, me.friends)));
});
r.get('/:id', auth, async (req, res) => {
  const me = await ctx(req); const p = await one(req.params.id);
  if (!p || !canSee(p, me._id, me.friends)) return bad(res, 'Post not found or you don\u2019t have permission', 404);
  res.json(p);
});
r.post('/', auth, async (req, res) => {
  const { text = '', image, images = [], video, privacy, feeling, group, page } = req.body;
  const imgs = [...(Array.isArray(images) ? images : []), ...(image ? [image] : [])].slice(0, 10);
  if (!text.trim() && !imgs.length && !video) return bad(res, 'Post can\u2019t be empty');
  const doc = { author: req.userId, text: text.trim(), images: imgs, video, feeling, privacy: ['public', 'friends', 'only_me'].includes(privacy) ? privacy : 'friends' };
  if (group) { const g = await Group.findById(group); if (!g || !g.members.map(String).includes(req.userId)) return bad(res, 'Join the group to post', 403); doc.group = g._id; doc.privacy = 'public';
    g.members.forEach(m => notify(m, req.userId, 'group_post', null, { link: `/groups/${g._id}`, text: g.name })); }
  if (page) { const pg = await Page.findById(page); if (!pg || String(pg.owner) !== req.userId) return bad(res, 'Only the page owner can post', 403); doc.page = pg._id; doc.privacy = 'public'; }
  const p = await Post.create(doc);
  res.status(201).json(await one(p._id));
});
r.put('/:id', auth, async (req, res) => {
  const p = await Post.findById(req.params.id);
  if (!p) return bad(res, 'Post not found', 404);
  if (String(p.author) !== req.userId) return bad(res, 'Not your post', 403);
  const { text, privacy, images } = req.body;
  if (text !== undefined) p.text = text.trim();
  if (privacy && !p.group && !p.page) p.privacy = privacy;
  if (Array.isArray(images)) { p.images = images; p.image = undefined; }
  await p.save(); res.json(await one(p._id));
});
r.delete('/:id', auth, async (req, res) => {
  const p = await Post.findById(req.params.id); if (!p) return bad(res, 'Post not found', 404);
  let ok = String(p.author) === req.userId;
  if (!ok && p.group) ok = !!(await Group.exists({ _id: p.group, admins: req.userId }));
  if (!ok) return bad(res, 'Not allowed', 403);
  await p.deleteOne(); res.json({ ok: true });
});
r.post('/:id/react', auth, async (req, res) => {
  const type = req.body.type || 'like';
  if (!REACTIONS.includes(type)) return bad(res, 'Invalid reaction');
  const p = await Post.findById(req.params.id); if (!p) return bad(res, 'Post not found', 404);
  const i = p.reactions.findIndex(x => String(x.user) === req.userId);
  let added = false;
  if (i >= 0 && p.reactions[i].type === type && !req.body.set) p.reactions.splice(i, 1);
  else if (i >= 0) p.reactions[i].type = type; else { p.reactions.push({ user: req.userId, type }); added = true; }
  p.likes = p.likes.filter(l => String(l) !== req.userId); // migrate legacy like
  await p.save(); if (added) notify(p.author, req.userId, 'react', p._id, { text: type, link: link(p) });
  res.json(await one(p._id));
});
r.post('/:id/like', auth, async (req, res) => { req.body = { type: 'like' }; const p = await Post.findById(req.params.id); if (!p) return bad(res, 'Post not found', 404);
  const i = p.reactions.findIndex(x => String(x.user) === req.userId); i >= 0 ? p.reactions.splice(i, 1) : p.reactions.push({ user: req.userId, type: 'like' });
  await p.save(); if (i < 0) notify(p.author, req.userId, 'react', p._id, { text: 'like', link: link(p) }); res.json(p.reactions.map(x => x.user)); });
r.post('/:id/comment', auth, async (req, res) => {
  const text = req.body.text?.trim(); if (!text) return bad(res, 'Comment can\u2019t be empty');
  const p = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: { author: req.userId, text } } }, { new: true });
  if (!p) return bad(res, 'Post not found', 404);
  notify(p.author, req.userId, 'comment', p._id, { link: link(p) });
  res.json(await one(p._id));
});
function findC(p, cid, rid) { const c = p.comments.id(cid); if (!c) return {}; return { c, t: rid ? c.replies.id(rid) : c }; }
r.post('/:id/comments/:cid/reply', auth, async (req, res) => {
  const text = req.body.text?.trim(); if (!text) return bad(res, 'Reply can\u2019t be empty');
  const p = await Post.findById(req.params.id); const { c } = p ? findC(p, req.params.cid) : {};
  if (!c) return bad(res, 'Comment not found', 404);
  c.replies.push({ author: req.userId, text }); await p.save();
  notify(c.author, req.userId, 'reply', p._id, { link: link(p) });
  res.json(await one(p._id));
});
const target = async (req, res) => { const p = await Post.findById(req.params.id); const { t } = p ? findC(p, req.params.cid, req.params.rid) : {}; if (!t) { bad(res, 'Comment not found', 404); return {}; } return { p, t }; };
for (const path of ['/:id/comments/:cid', '/:id/comments/:cid/replies/:rid']) {
  r.post(path + '/like', auth, async (req, res) => { const { p, t } = await target(req, res); if (!t) return;
    const i = t.likes.map(String).indexOf(req.userId); i >= 0 ? t.likes.splice(i, 1) : t.likes.push(req.userId);
    await p.save(); if (i < 0) notify(t.author, req.userId, 'comment_like', p._id, { link: link(p) }); res.json(await one(p._id)); });
  r.put(path, auth, async (req, res) => { const { p, t } = await target(req, res); if (!t) return;
    if (String(t.author) !== req.userId) return bad(res, 'Not your comment', 403);
    if (!req.body.text?.trim()) return bad(res, 'Comment can\u2019t be empty');
    t.text = req.body.text.trim(); await p.save(); res.json(await one(p._id)); });
  r.delete(path, auth, async (req, res) => { const { p, t } = await target(req, res); if (!t) return;
    if (String(t.author) !== req.userId && String(p.author) !== req.userId) return bad(res, 'Not allowed', 403);
    t.deleteOne(); await p.save(); res.json(await one(p._id)); });
}
r.post('/:id/share', auth, async (req, res) => {
  let orig = await Post.findById(req.params.id); if (!orig) return bad(res, 'Post not found', 404);
  if (orig.sharedFrom) orig = (await Post.findById(orig.sharedFrom)) || orig;
  const me = await ctx(req); if (!canSee(orig, me._id, me.friends)) return bad(res, 'Not allowed', 403);
  const p = await Post.create({ author: req.userId, text: req.body.text?.trim() || '', sharedFrom: orig._id, privacy: req.body.privacy || 'friends' });
  orig.shares++; await orig.save();
  notify(orig.author, req.userId, 'share', orig._id, { link: link(orig) });
  res.status(201).json(await one(p._id));
});
r.post('/:id/save', auth, async (req, res) => {
  const me = await ctx(req); const has = me.saved.map(String).includes(req.params.id);
  await User.findByIdAndUpdate(req.userId, has ? { $pull: { saved: req.params.id } } : { $addToSet: { saved: req.params.id } });
  res.json({ saved: !has });
});
export default r;
