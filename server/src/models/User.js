import mongoose from 'mongoose';
const ref = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
const s = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  suspended: { type: Boolean, default: false }, suspensionReason: String, suspendedAt: Date,
  profileVisibility: { type: String, enum: ['everyone', 'friends'], default: 'everyone' },
  discoverable: { type: Boolean, default: true }, allowFriendRequests: { type: Boolean, default: true },
  notificationPreferences: {
    friendRequests: { type: Boolean, default: true },
    postActivity: { type: Boolean, default: true },
    communityActivity: { type: Boolean, default: true },
  },
  avatar: String, cover: String, bio: { type: String, maxlength: 300 },
  work: String, education: String, location: String, hometown: String, relationship: String, website: String, birthday: String,
  friends: [ref], requests: [ref],
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });
s.index({ name: 'text' });
export default mongoose.model('User', s);
