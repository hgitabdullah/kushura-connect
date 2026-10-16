import mongoose from 'mongoose';
const O = mongoose.Schema.Types.ObjectId;
const s = new mongoose.Schema({ seller: { type: O, ref: 'User' }, title: { type: String, required: true, maxlength: 100 }, price: { type: Number, min: 0, required: true },
  category: String, condition: String, location: String, description: String, images: [String], sold: { type: Boolean, default: false } }, { timestamps: true });
export default mongoose.model('Listing', s);
