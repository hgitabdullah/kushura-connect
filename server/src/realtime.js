import jwt from 'jsonwebtoken';
import Notification from './models/Notification.js';
import Message from './models/Message.js';
import User from './models/User.js';
let io; const online = new Map();
export const onlineIds = () => [...online.keys()];
export function initSocket(server) {
  return import('socket.io').then(({ Server }) => {
    io = new Server(server, { cors: { origin: '*' } });
    io.use(async (s, next) => { try {
      const { id } = jwt.verify(s.handshake.auth.token, process.env.JWT_SECRET);
      const user = await User.findById(id).select('_id suspended');
      if (!user || user.suspended) throw new Error('auth');
      s.userId = String(user._id); next();
    } catch { next(new Error('auth')); } });
    io.on('connection', s => {
      s.join(s.userId); online.set(s.userId, (online.get(s.userId) || 0) + 1); io.emit('online', onlineIds());
      s.on('typing', to => io.to(String(to)).emit('typing', s.userId));
      s.on('seen', async from => { await Message.updateMany({ from, to: s.userId, read: false }, { read: true }); io.to(String(from)).emit('seen', { by: s.userId }); });
      s.on('disconnect', () => { const n = online.get(s.userId) - 1; n ? online.set(s.userId, n) : online.delete(s.userId); io.emit('online', onlineIds()); });
    });
  });
}
export const emitTo = (userId, ev, data) => io?.to(String(userId)).emit(ev, data);
export const disconnectUser = userId => io?.in(String(userId)).disconnectSockets(true);
export async function notify(user, from, type, post, extra = {}) {
  if (!user || String(user) === String(from)) return;
  const preference = ['request', 'accept'].includes(type) ? 'friendRequests'
    : ['react', 'like', 'comment', 'reply', 'comment_like', 'share'].includes(type) ? 'postActivity'
      : ['group_post', 'group_join', 'group_admin', 'page_follow'].includes(type) ? 'communityActivity' : null;
  if (preference) {
    const recipient = await User.findById(user).select('notificationPreferences');
    if (recipient?.notificationPreferences?.[preference] === false) return;
  }
  const n = await Notification.create({ user, from, type, post, ...extra });
  emitTo(user, 'notification', await n.populate('from', 'name avatar'));
}
