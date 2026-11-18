import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import router from './routes/index.js';
import { tidakDitemukan, penanganError } from './middlewares/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buatApp() {
  const app = express();

  // Di belakang proxy hosting (Render/Railway dsb.) supaya cookie secure & IP asli benar
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true, // penting: cookie httpOnly ikut terkirim
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', waktu: new Date().toISOString() });
  });

  app.use('/api', router);

  // Frontend hasil build (opsional, untuk mode produksi)
  const dist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(tidakDitemukan);
  app.use(penanganError);
  return app;
}
