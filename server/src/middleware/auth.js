import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export default async (req, res, next) => {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(t, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('_id role suspended');
    if (!user) return res.status(401).json({ error: 'Account not found' });
    if (user.suspended) return res.status(403).json({ error: 'This account is suspended. Contact support.' });
    req.userId = String(user._id); req.userRole = user.role || 'user'; next();
  }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};
