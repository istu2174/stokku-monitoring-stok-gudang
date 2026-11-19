import 'dotenv/config';
import crypto from 'node:crypto';

const nodeEnv = process.env.NODE_ENV || 'development';

/** Konfigurasi terpusat — dibaca sekali dari .env */
export const config = {
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Di produksi jangan pernah pakai secret bawaan repo: kalau JWT_SECRET kosong, buat acak per proses
  // (sesi ikut hangus saat restart, aman karena siapa pun bisa memalsukan token dari secret publik).
  jwtSecret:
    process.env.JWT_SECRET ||
    (nodeEnv === 'production' ? crypto.randomBytes(32).toString('hex') : 'stokku-dev-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: 'stokku_token',
  nodeEnv,
  // Mode demo publik: akun seed dikunci supaya pengunjung tidak saling mengunci. Default aktif di produksi.
  demo: process.env.DEMO_MODE ? process.env.DEMO_MODE === 'true' : nodeEnv === 'production',
};
