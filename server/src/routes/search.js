import { Router } from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Group from '../models/Group.js';
import Page from '../models/Page.js';
import { canSee, POST_POP, U } from '../utils/helpers.js';
const r = Router();
r.get('/', auth, async (req, res) => {
  const q = String(req.query.q || '').trim(); if (!q) return res.json({ people: [], posts: [], groups: [], pages: [] });
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); const me = await User.findById(req.userId);
  const [people, posts, groups, pages] = await Promise.all([
    User.find({ name: re, _id: { $ne: me._id }, discoverable: { $ne: false } }).select(U + ' location work friends').limit(20),
    Post.find({ text: re }).sort('-createdAt').limit(30).populate(POST_POP),
    Group.find({ $or: [{ name: re }, { description: re }] }).limit(20), Page.find({ $or: [{ name: re }, { category: re }] }).limit(20)]);
  const f = me.friends.map(String);
  res.json({ people: people.map(p => ({ _id: p._id, name: p.name, avatar: p.avatar, location: p.location, work: p.work, isFriend: f.includes(String(p._id)), mutual: p.friends.filter(x => f.includes(String(x))).length })),
    posts: posts.filter(p => canSee(p, me._id, me.friends)),
    groups: groups.map(g => ({ _id: g._id, name: g.name, cover: g.cover, privacy: g.privacy, memberCount: g.members.length, isMember: g.members.map(String).includes(req.userId) })),
    pages: pages.map(p => ({ _id: p._id, name: p.name, avatar: p.avatar, category: p.category, followerCount: p.followers.length, isFollowing: p.followers.map(String).includes(req.userId) })) });
});
export default r;
