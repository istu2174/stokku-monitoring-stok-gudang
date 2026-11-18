import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { IZIN } from '../lib/roles.js';

/** Ambil token dari cookie httpOnly, atau header Bearer (untuk alat uji/CLI). */
function ambilToken(req) {
  if (req.cookies?.[config.cookieName]) return req.cookies[config.cookieName];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Middleware wajib login. Mengisi req.user dengan data user aktif dari DB. */
export async function auth(req, res, next) {
  try {
    const token = ambilToken(req);
    if (!token) throw unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw unauthorized('Sesi kamu sudah habis. Silakan login lagi.');
    }

    // Selalu baca ulang dari DB: user yang dinonaktifkan langsung kehilangan akses
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, nama: true, username: true, email: true, role: true, aktif: true },
    });
    if (!user) throw unauthorized('Akun tidak ditemukan.');
    if (!user.aktif) throw forbidden('Akun kamu sudah dinonaktifkan. Hubungi Admin Sistem.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Middleware cek izin berdasarkan matriks role. */
export function requireIzin(namaIzin) {
  return (req, res, next) => {
    const daftar = IZIN[namaIzin] || [];
    if (!req.user) return next(unauthorized());
    if (!daftar.includes(req.user.role)) {
      return next(forbidden('Role kamu tidak punya akses untuk aksi ini.'));
    }
    next();
  };
}
