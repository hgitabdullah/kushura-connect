import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const reply = new mongoose.Schema({ author: { type: O, ref: 'User' }, text: String, likes: [{ type: O, ref: 'User' }] }, { timestamps: true });
const comment = new mongoose.Schema({ author: { type: O, ref: 'User' }, text: String, likes: [{ type: O, ref: 'User' }], replies: [reply] }, { timestamps: true });
export const REACTIONS = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const s = new mongoose.Schema({
  author: { type: O, ref: 'User', required: true },
  text: { type: String, maxlength: 5000 }, image: String, images: [String], video: String,
  feeling: String,
  privacy: { type: String, enum: ['public', 'friends', 'only_me'], default: 'friends' },
  likes: [{ type: O, ref: 'User' }],
  reactions: [{ user: { type: O, ref: 'User' }, type: { type: String, enum: REACTIONS } }],
  comments: [comment],
  sharedFrom: { type: O, ref: 'Post' }, shares: { type: Number, default: 0 },
  group: { type: O, ref: 'Group' }, page: { type: O, ref: 'Page' },
}, { timestamps: true });
s.index({ text: 'text' });
export default mongoose.model('Post', s);
