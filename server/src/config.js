import 'dotenv/config';

/** Konfigurasi terpusat — dibaca sekali dari .env */
export const config = {
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'stokku-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: 'stokku_token',
  nodeEnv: process.env.NODE_ENV || 'development',
};
