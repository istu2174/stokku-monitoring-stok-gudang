import { prisma } from '../lib/prisma.js';
import { catatAudit } from '../lib/audit.js';
import { conflict, notFound } from '../lib/errors.js';
import { pageLimit, teksOpsional, teksWajib } from '../utils/validasi.js';

/** GET /api/supplier */
export async function daftarSupplier(req, res, next) {
  try {
    const { q } = req.query;
    const { page, limit, skip } = pageLimit(req.query, 50);

    const where = q ? { nama: { contains: String(q) } } : {};
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nama: 'asc' },
        include: { _count: { select: { transaksi: true } } },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      items: items.map((s) => ({ ...s, jumlahTransaksi: s._count.transaksi })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/supplier */
export async function tambahSupplier(req, res, next) {
  try {
    const data = {
      nama: teksWajib(req.body?.nama, 'Nama supplier', 120),
      kontak: teksOpsional(req.body?.kontak, 120),
      alamat: teksOpsional(req.body?.alamat, 300),
      catatan: teksOpsional(req.body?.catatan, 300),
      aktif: req.body?.aktif === undefined ? true : Boolean(req.body.aktif),
    };

    const supplier = await prisma.supplier.create({ data });
    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'TAMBAH_SUPPLIER',
      entitas: 'Supplier',
      entitasId: supplier.id,
      detail: `Menambah supplier ${supplier.nama}`,
    });
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/supplier/:id */
export async function ubahSupplier(req, res, next) {
  try {
    const target = await prisma.supplier.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('Supplier tidak ditemukan.');

    const data = {};
    if (req.body?.nama !== undefined) data.nama = teksWajib(req.body.nama, 'Nama supplier', 120);
    if (req.body?.kontak !== undefined) data.kontak = teksOpsional(req.body.kontak, 120);
    if (req.body?.alamat !== undefined) data.alamat = teksOpsional(req.body.alamat, 300);
    if (req.body?.catatan !== undefined) data.catatan = teksOpsional(req.body.catatan, 300);
    if (req.body?.aktif !== undefined) data.aktif = Boolean(req.body.aktif);

    const supplier = await prisma.supplier.update({ where: { id: target.id }, data });
    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'UBAH_SUPPLIER',
      entitas: 'Supplier',
      entitasId: supplier.id,
      detail: `Mengubah supplier ${supplier.nama}`,
    });
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/supplier/:id — ditolak kalau sudah dipakai transaksi. */
export async function hapusSupplier(req, res, next) {
  try {
    const target = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { transaksi: true } } },
    });
    if (!target) throw notFound('Supplier tidak ditemukan.');

    if (target._count.transaksi > 0) {
      throw conflict(
        `Supplier "${target.nama}" sudah dipakai ${target._count.transaksi} transaksi, jadi belum bisa dihapus. Nonaktifkan saja kalau sudah tidak dipakai.`,
      );
    }

    await prisma.supplier.delete({ where: { id: target.id } });
    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'HAPUS_SUPPLIER',
      entitas: 'Supplier',
      entitasId: target.id,
      detail: `Menghapus supplier ${target.nama}`,
    });
    res.json({ message: 'Supplier dihapus.' });
  } catch (err) {
    next(err);
  }
}
