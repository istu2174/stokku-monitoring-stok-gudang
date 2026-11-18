import { AppError } from '../lib/errors.js';

/** 404 untuk endpoint yang tidak dikenal. */
export function tidakDitemukan(req, res, next) {
  next(new AppError(404, 'Endpoint tidak ditemukan.'));
}

/** Penanganan error terpusat. Semua response error: { message: "..." } */
// eslint-disable-next-line no-unused-vars
export function penanganError(err, req, res, next) {
  if (res.headersSent) return;

  // Error bawaan Prisma yang sering muncul
  if (err.code === 'P2002') {
    const field = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target;
    return res.status(409).json({ message: `Data sudah ada (${field || 'duplikat'}).` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Data yang dimaksud tidak ditemukan.' });
  }
  if (err.code === 'P2003') {
    return res
      .status(409)
      .json({ message: 'Data ini masih dipakai di tempat lain, jadi belum bisa dihapus.' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error('[stokku]', err);

  res.status(status).json({
    message: status >= 500 ? 'Terjadi kesalahan di server. Coba lagi sebentar.' : err.message,
    ...(err.detail ? { detail: err.detail } : {}),
  });
}
