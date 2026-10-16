import mongoose from 'mongoose';
export const isId = id => mongoose.isValidObjectId(id);
export const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
export const U = 'name avatar';
export const POST_POP = [
  { path: 'author', select: U }, { path: 'comments.author', select: U }, { path: 'comments.replies.author', select: U },
  { path: 'reactions.user', select: U }, { path: 'group', select: 'name cover privacy' }, { path: 'page', select: 'name avatar' },
  { path: 'sharedFrom', populate: [{ path: 'author', select: U }, { path: 'page', select: 'name avatar' }] },
];
const s = v => String(v?._id || v);
export function canSee(p, me, friends) {
  if (!p) return false;
  const a = s(p.author);
  if (a === s(me) || p.privacy === 'public' || p.group || p.page) return true;
  return p.privacy === 'friends' && friends.map(String).includes(a);
}
export const clean = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, typeof o[k] === 'string' ? o[k].trim() : o[k]]));
