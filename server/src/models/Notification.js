import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const s = new mongoose.Schema({ user: { type: O, ref: 'User' }, from: { type: O, ref: 'User' }, type: String, post: { type: O, ref: 'Post' }, link: String, text: String, read: { type: Boolean, default: false } }, { timestamps: true });
export default mongoose.model('Notification', s);
