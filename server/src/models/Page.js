import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const s = new mongoose.Schema({ name: { type: String, required: true, maxlength: 80 }, category: String, description: String, avatar: String, cover: String,
  owner: { type: O, ref: 'User' }, followers: [{ type: O, ref: 'User' }] }, { timestamps: true });
export default mongoose.model('Page', s);
