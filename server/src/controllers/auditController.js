import { prisma } from '../lib/prisma.js';
import { pageLimit } from '../utils/validasi.js';

/** GET /api/audit — riwayat aksi penting (read-only). */
export async function daftarAudit(req, res, next) {
  try {
    const { aksi, entitas, dari, ke, q } = req.query;
    const { page, limit, skip } = pageLimit(req.query, 25);

    const where = {};
    if (aksi) where.aksi = String(aksi);
    if (entitas) where.entitas = String(entitas);
    if (dari || ke) {
      where.waktu = {
        ...(dari ? { gte: new Date(String(dari)) } : {}),
        ...(ke ? { lte: new Date(`${String(ke)}T23:59:59`) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { detail: { contains: String(q) } },
        { aksi: { contains: String(q) } },
        { entitas: { contains: String(q) } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, nama: true, role: true } } },
        orderBy: { waktu: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Daftar aksi unik untuk pilihan filter di frontend
    const aksiUnik = await prisma.auditLog.findMany({
      distinct: ['aksi'],
      select: { aksi: true },
      orderBy: { aksi: 'asc' },
    });

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      pilihanAksi: aksiUnik.map((a) => a.aksi),
    });
  } catch (err) {
    next(err);
  }
}
