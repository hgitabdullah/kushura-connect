import 'dotenv/config';
import mongoose from 'mongoose';
import { seed } from './seed.js';
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) { console.error('Set MONGODB_URI first'); process.exit(1); }
await mongoose.connect(mongoUri);
if (process.argv.includes('--reset')) await mongoose.connection.dropDatabase();
await seed(); await mongoose.disconnect();
