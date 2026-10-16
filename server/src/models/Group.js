import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const s = new mongoose.Schema({ name: { type: String, required: true, maxlength: 80 }, description: String, cover: String,
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  owner: { type: O, ref: 'User' }, admins: [{ type: O, ref: 'User' }], members: [{ type: O, ref: 'User' }] }, { timestamps: true });
export default mongoose.model('Group', s);
