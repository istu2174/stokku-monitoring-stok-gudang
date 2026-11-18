import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { catatAudit } from '../lib/audit.js';
import { izinRole, LABEL_ROLE } from '../lib/roles.js';
import { unauthorized, badRequest } from '../lib/errors.js';
import { teksWajib } from '../utils/validasi.js';

/** Bentuk data user yang aman dikirim ke frontend. */
function userAman(user) {
  return {
    id: user.id,
    nama: user.nama,
    username: user.username,
    email: user.email,
    role: user.role,
    labelRole: LABEL_ROLE[user.role] || user.role,
    aktif: user.aktif,
  };
}

function setCookieLogin(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true, // tidak bisa dibaca JavaScript → aman dari XSS
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 8 * 60 * 60 * 1000, // 8 jam
    path: '/',
  });
}

/** POST /api/auth/login — username atau email + password. */
export async function login(req, res, next) {
  try {
    const identifier = teksWajib(req.body?.username, 'Username atau email', 120);
    const password = String(req.body?.password ?? '');
    if (!password) throw badRequest('Password wajib diisi.');

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });

    // Pesan disamakan supaya tidak membocorkan akun mana yang ada
    if (!user) throw unauthorized('Username/email atau password salah.');

    const cocok = await bcrypt.compare(password, user.passwordHash);
    if (!cocok) {
      await catatAudit(prisma, {
        userId: user.id,
        aksi: 'LOGIN_GAGAL',
        entitas: 'User',
        entitasId: user.id,
        detail: `Percobaan login gagal untuk ${user.username}`,
      });
      throw unauthorized('Username/email atau password salah.');
    }

    if (!user.aktif) throw unauthorized('Akun kamu dinonaktifkan. Hubungi Admin Sistem.');

    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    setCookieLogin(res, token);

    await catatAudit(prisma, {
      userId: user.id,
      aksi: 'LOGIN',
      entitas: 'User',
      entitasId: user.id,
      detail: `${user.username} login sebagai ${LABEL_ROLE[user.role]}`,
    });

    res.json({ user: userAman(user), izin: izinRole(user.role) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout */
export async function logout(req, res, next) {
  try {
    if (req.user) {
      await catatAudit(prisma, {
        userId: req.user.id,
        aksi: 'LOGOUT',
        entitas: 'User',
        entitasId: req.user.id,
        detail: `${req.user.username} logout`,
      });
    }
    res.clearCookie(config.cookieName, { path: '/' });
    res.json({ message: 'Berhasil logout.' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me — data user yang sedang login + daftar izinnya. */
export async function me(req, res) {
  res.json({ user: userAman(req.user), izin: izinRole(req.user.role) });
}

/** PUT /api/auth/password — ganti password sendiri. */
export async function gantiPassword(req, res, next) {
  try {
    const passwordLama = String(req.body?.passwordLama ?? '');
    const passwordBaru = String(req.body?.passwordBaru ?? '');

    if (!passwordLama) throw badRequest('Password lama wajib diisi.');
    if (passwordBaru.length < 6) throw badRequest('Password baru minimal 6 karakter.');
    if (passwordBaru === passwordLama) {
      throw badRequest('Password baru harus berbeda dari password lama.');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const cocok = await bcrypt.compare(passwordLama, user.passwordHash);
    if (!cocok) throw badRequest('Password lama salah.');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(passwordBaru, 10) },
    });

    await catatAudit(prisma, {
      userId: user.id,
      aksi: 'UBAH_PASSWORD',
      entitas: 'User',
      entitasId: user.id,
      detail: `${user.username} mengganti password sendiri`,
    });

    res.json({ message: 'Password berhasil diganti.' });
  } catch (err) {
    next(err);
  }
}
