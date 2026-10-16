import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const email = 'mdabdullah35363@gmail.com';
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!uri) { console.error('Set MONGODB_URI in server/.env first.'); process.exit(1); }
if (!password || password.length < 12) { console.error('Set ADMIN_BOOTSTRAP_PASSWORD to a password of at least 12 characters for this one-time setup.'); process.exit(1); }

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const hash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    { $set: { password: hash, role: 'admin', suspended: false }, $setOnInsert: { name: 'Md Abdullah' }, $unset: { suspendedAt: 1, suspensionReason: 1 } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  console.log(`Admin account ready for ${email}. Password stored as a bcrypt hash.`);
} catch (error) {
  console.error('Could not create the admin account:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
