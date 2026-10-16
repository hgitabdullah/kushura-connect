import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const s = new mongoose.Schema({ author: { type: O, ref: 'User' }, image: String, text: String, bg: String, viewers: [{ type: O, ref: 'User' }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 864e5), index: { expires: 0 } } }, { timestamps: true });
export default mongoose.model('Story', s);
