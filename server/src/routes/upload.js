import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import auth from '../middleware/auth.js';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const storage = multer.diskStorage({ destination: dir, filename: (req, f, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + path.extname(f.originalname).toLowerCase()) });
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, f, cb) => /^(image|video)\//.test(f.mimetype) ? cb(null, true) : cb(Object.assign(new Error('Only images and videos are allowed'), { status: 400 })) });
const r = Router();
r.post('/', auth, upload.array('files', 10), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files' });
  res.json({ urls: req.files.map(f => '/uploads/' + f.filename), files: req.files.map(f => ({ url: '/uploads/' + f.filename, type: f.mimetype.split('/')[0] })) });
});
export default r;
