import { prisma } from '../lib/prisma.js';
import { catatAudit } from '../lib/audit.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { teksWajib, validasiWarna } from '../utils/validasi.js';

/** GET /api/kategori — semua kategori + jumlah barang. */
export async function daftarKategori(req, res, next) {
  try {
    const items = await prisma.kategori.findMany({
      orderBy: { nama: 'asc' },
      include: { _count: { select: { barang: true } } },
    });
    res.json({
      items: items.map((k) => ({ ...k, jumlahBarang: k._count.barang })),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/kategori */
export async function tambahKategori(req, res, next) {
  try {
    const nama = teksWajib(req.body?.nama, 'Nama kategori', 60);
    const ikon = String(req.body?.ikon ?? '📦').trim().slice(0, 4) || '📦';
    const warna = validasiWarna(req.body?.warna);

    const sudahAda = await prisma.kategori.findUnique({ where: { nama } });
    if (sudahAda) throw conflict('Nama kategori sudah dipakai.');

    const kategori = await prisma.kategori.create({ data: { nama, ikon, warna } });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'TAMBAH_KATEGORI',
      entitas: 'Kategori',
      entitasId: kategori.id,
      detail: `Menambah kategori ${nama}`,
    });

    res.status(201).json(kategori);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/kategori/:id */
export async function ubahKategori(req, res, next) {
  try {
    const target = await prisma.kategori.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('Kategori tidak ditemukan.');

    const data = {};
    if (req.body?.nama !== undefined) data.nama = teksWajib(req.body.nama, 'Nama kategori', 60);
    if (req.body?.ikon !== undefined) data.ikon = String(req.body.ikon).trim().slice(0, 4) || '📦';
    if (req.body?.warna !== undefined) data.warna = validasiWarna(req.body.warna);

    if (data.nama && data.nama !== target.nama) {
      const bentrok = await prisma.kategori.findUnique({ where: { nama: data.nama } });
      if (bentrok) throw conflict('Nama kategori sudah dipakai.');
    }

    const kategori = await prisma.kategori.update({ where: { id: target.id }, data });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'UBAH_KATEGORI',
      entitas: 'Kategori',
      entitasId: kategori.id,
      detail: `Mengubah kategori ${kategori.nama}`,
    });

    res.json(kategori);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/kategori/:id?pindahKe=<id>
 * Kategori yang masih dipakai barang tidak bisa dihapus, kecuali barangnya
 * dipindahkan dulu ke kategori lain.
 */
export async function hapusKategori(req, res, next) {
  try {
    const target = await prisma.kategori.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { barang: true } } },
    });
    if (!target) throw notFound('Kategori tidak ditemukan.');

    const pindahKe = String(req.query.pindahKe ?? '').trim();

    if (target._count.barang > 0 && !pindahKe) {
      const err = conflict(
        `Kategori "${target.nama}" masih dipakai ${target._count.barang} barang. Pindahkan barangnya dulu ya.`,
      );
      err.kode = 'KATEGORI_DIPAKAI';
      err.jumlahBarang = target._count.barang;
      err.kategoriId = target.id;
      throw err;
    }

    if (pindahKe) {
      if (pindahKe === target.id) throw badRequest('Kategori tujuan harus berbeda.');
      const tujuan = await prisma.kategori.findUnique({ where: { id: pindahKe } });
      if (!tujuan) throw badRequest('Kategori tujuan tidak ditemukan.');

      await prisma.$transaction([
        prisma.barang.updateMany({
          where: { kategoriId: target.id },
          data: { kategoriId: tujuan.id },
        }),
        prisma.kategori.delete({ where: { id: target.id } }),
      ]);

      await catatAudit(prisma, {
        userId: req.user.id,
        aksi: 'HAPUS_KATEGORI',
        entitas: 'Kategori',
        entitasId: target.id,
        detail: `Menghapus kategori ${target.nama}, ${target._count.barang} barang dipindah ke ${tujuan.nama}`,
      });

      return res.json({
        message: 'Kategori dihapus, barang-barangnya sudah dipindahkan.',
        dipindahkan: target._count.barang,
      });
    }

    await prisma.kategori.delete({ where: { id: target.id } });
    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'HAPUS_KATEGORI',
      entitas: 'Kategori',
      entitasId: target.id,
      detail: `Menghapus kategori ${target.nama}`,
    });

    res.json({ message: 'Kategori dihapus.', dipindahkan: 0 });
  } catch (err) {
    next(err);
  }
}
