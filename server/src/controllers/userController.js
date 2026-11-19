import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { catatAudit } from '../lib/audit.js';
import { LABEL_ROLE, ROLE, SEMUA_ROLE } from '../lib/roles.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { jagaAkunDemo } from '../lib/demo.js';
import {
  pageLimit,
  salahSatuDari,
  teksWajib,
} from '../utils/validasi.js';

const SELECT_AMAN = {
  id: true,
  nama: true,
  username: true,
  email: true,
  role: true,
  aktif: true,
  createdAt: true,
};

/** GET /api/users — daftar user (Admin Sistem saja). */
export async function daftarUser(req, res, next) {
  try {
    const { q, role, aktif } = req.query;
    const { page, limit, skip } = pageLimit(req.query, 20);

    const where = {};
    if (q) {
      where.OR = [
        { nama: { contains: String(q) } },
        { username: { contains: String(q) } },
        { email: { contains: String(q) } },
      ];
    }
    if (role) where.role = salahSatuDari(role, SEMUA_ROLE, 'Role');
    if (aktif === 'true' || aktif === 'false') where.aktif = aktif === 'true';

    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, select: SELECT_AMAN, orderBy: { nama: 'asc' }, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    res.json({
      items: items.map((u) => ({ ...u, labelRole: LABEL_ROLE[u.role] })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/users — tambah user baru. */
export async function tambahUser(req, res, next) {
  try {
    const nama = teksWajib(req.body?.nama, 'Nama', 100);
    const username = teksWajib(req.body?.username, 'Username', 50).toLowerCase();
    const email = teksWajib(req.body?.email, 'Email', 120).toLowerCase();
    const role = salahSatuDari(req.body?.role, SEMUA_ROLE, 'Role');
    const password = String(req.body?.password ?? '');

    if (!/^[a-z0-9._-]+$/.test(username)) {
      throw badRequest('Username hanya boleh huruf, angka, titik, garis bawah, atau strip.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest('Format email tidak valid.');
    if (password.length < 6) throw badRequest('Password minimal 6 karakter.');

    const sudahAda = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (sudahAda) throw conflict('Username atau email sudah dipakai.');

    const user = await prisma.user.create({
      data: { nama, username, email, role, passwordHash: await bcrypt.hash(password, 10) },
      select: SELECT_AMAN,
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'TAMBAH_USER',
      entitas: 'User',
      entitasId: user.id,
      detail: `Membuat user ${username} dengan role ${LABEL_ROLE[role]}`,
    });

    res.status(201).json({ ...user, labelRole: LABEL_ROLE[user.role] });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/users/:id — edit data user, role, atau status aktif. */
export async function ubahUser(req, res, next) {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('User tidak ditemukan.');
    jagaAkunDemo(target.username);

    const data = {};
    if (req.body?.nama !== undefined) data.nama = teksWajib(req.body.nama, 'Nama', 100);
    if (req.body?.username !== undefined) {
      data.username = teksWajib(req.body.username, 'Username', 50).toLowerCase();
    }
    if (req.body?.email !== undefined) {
      const email = teksWajib(req.body.email, 'Email', 120).toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest('Format email tidak valid.');
      data.email = email;
    }
    if (req.body?.role !== undefined) data.role = salahSatuDari(req.body.role, SEMUA_ROLE, 'Role');
    if (req.body?.aktif !== undefined) data.aktif = Boolean(req.body.aktif);

    // Jangan sampai admin mengunci dirinya sendiri
    if (target.id === req.user.id) {
      if (data.aktif === false) throw badRequest('Kamu tidak bisa menonaktifkan akun sendiri.');
      if (data.role && data.role !== target.role) {
        throw badRequest('Kamu tidak bisa mengubah role akun sendiri.');
      }
    }

    // Admin Sistem terakhir tidak boleh dinonaktifkan / diturunkan
    const adminAktif = await prisma.user.count({
      where: { role: ROLE.ADMIN_SISTEM, aktif: true },
    });
    const kehilanganAdmin =
      target.role === ROLE.ADMIN_SISTEM &&
      target.aktif &&
      (data.aktif === false || (data.role && data.role !== ROLE.ADMIN_SISTEM));
    if (kehilanganAdmin && adminAktif <= 1) {
      throw badRequest('Harus ada minimal satu Admin Sistem yang aktif.');
    }

    if (data.username || data.email) {
      const bentrok = await prisma.user.findFirst({
        where: {
          id: { not: target.id },
          OR: [
            ...(data.username ? [{ username: data.username }] : []),
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });
      if (bentrok) throw conflict('Username atau email sudah dipakai user lain.');
    }

    const user = await prisma.user.update({
      where: { id: target.id },
      data,
      select: SELECT_AMAN,
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'UBAH_USER',
      entitas: 'User',
      entitasId: user.id,
      detail: `Mengubah user ${user.username}: ${JSON.stringify(data)}`,
    });

    res.json({ ...user, labelRole: LABEL_ROLE[user.role] });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/users/:id/password — reset password oleh Admin Sistem. */
export async function resetPassword(req, res, next) {
  try {
    const passwordBaru = String(req.body?.passwordBaru ?? '');
    if (passwordBaru.length < 6) throw badRequest('Password baru minimal 6 karakter.');

    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('User tidak ditemukan.');
    jagaAkunDemo(target.username);

    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash: await bcrypt.hash(passwordBaru, 10) },
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'RESET_PASSWORD',
      entitas: 'User',
      entitasId: target.id,
      detail: `Reset password untuk ${target.username}`,
    });

    res.json({ message: `Password ${target.username} berhasil direset.` });
  } catch (err) {
    next(err);
  }
}
