import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const s = new mongoose.Schema({ from: { type: O, ref: 'User' }, to: { type: O, ref: 'User' }, text: String, image: String, read: { type: Boolean, default: false } }, { timestamps: true });
export default mongoose.model('Message', s);
