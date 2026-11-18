import { prisma } from '../lib/prisma.js';
import { catatAudit } from '../lib/audit.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { buatSkuOtomatis } from '../services/skuService.js';
import { urutkanFEFO } from '../services/stokService.js';
import {
  angka,
  bilanganBulat,
  pageLimit,
  salahSatuDari,
  teksOpsional,
  teksWajib,
} from '../utils/validasi.js';

export const STATUS_STOK = ['AMAN', 'MENIPIS', 'HABIS'];

/** Tentukan status stok dari angka stok & stok minimum. */
export function statusStok(stok, stokMin) {
  if (stok <= 0) return 'HABIS';
  if (stok <= stokMin) return 'MENIPIS';
  return 'AMAN';
}

/** Ambil total stok & tanggal expired terdekat dari daftar batch. */
export function ringkasBatch(batches) {
  const stok = batches.reduce((total, b) => total + b.qty, 0);
  const berisi = batches.filter((b) => b.qty > 0);
  const urut = urutkanFEFO(berisi);
  const expiredTerdekat = urut.find((b) => b.expiredAt)?.expiredAt || null;
  return { stok, expiredTerdekat };
}

/** Bentuk data barang untuk response. */
function bentukBarang(barang) {
  const { stok, expiredTerdekat } = ringkasBatch(barang.batches || []);
  return {
    id: barang.id,
    sku: barang.sku,
    nama: barang.nama,
    kategori: barang.kategori,
    satuan: barang.satuan,
    stok,
    stokMin: barang.stokMin,
    status: statusStok(stok, barang.stokMin),
    lokasiRak: barang.lokasiRak,
    hargaBeli: barang.hargaBeli,
    nilaiStok: stok * barang.hargaBeli,
    foto: barang.foto,
    aktif: barang.aktif,
    expiredTerdekat,
    jumlahBatch: (barang.batches || []).filter((b) => b.qty > 0).length,
  };
}

/** GET /api/barang — pencarian, filter kategori/status, sorting, pagination. */
export async function daftarBarang(req, res, next) {
  try {
    const { q, kategoriId, status, aktif, sort = 'nama', order = 'asc' } = req.query;
    const { page, limit } = pageLimit(req.query, 10);

    const where = {};
    if (q) {
      where.OR = [
        { nama: { contains: String(q) } },
        { sku: { contains: String(q) } },
        { lokasiRak: { contains: String(q) } },
      ];
    }
    if (kategoriId) where.kategoriId = String(kategoriId);
    if (aktif === 'true' || aktif === 'false') where.aktif = aktif === 'true';

    const semua = await prisma.barang.findMany({
      where,
      include: { kategori: true, batches: true },
    });

    let items = semua.map(bentukBarang);
    if (status) {
      const s = salahSatuDari(status, STATUS_STOK, 'Status stok');
      items = items.filter((b) => b.status === s);
    }

    const arah = String(order).toLowerCase() === 'desc' ? -1 : 1;
    const kunci = ['nama', 'sku', 'stok', 'nilaiStok', 'hargaBeli'].includes(String(sort))
      ? String(sort)
      : 'nama';
    items.sort((a, b) => {
      if (kunci === 'nama' || kunci === 'sku') {
        return a[kunci].localeCompare(b[kunci]) * arah;
      }
      return (a[kunci] - b[kunci]) * arah;
    });

    const total = items.length;
    const mulai = (page - 1) * limit;

    res.json({
      items: items.slice(mulai, mulai + limit),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/barang/:id — detail + daftar batch. */
export async function detailBarang(req, res, next) {
  try {
    const barang = await prisma.barang.findUnique({
      where: { id: req.params.id },
      include: { kategori: true, batches: true },
    });
    if (!barang) throw notFound('Barang tidak ditemukan.');

    res.json({
      ...bentukBarang(barang),
      batches: urutkanFEFO(barang.batches).map((b) => ({
        id: b.id,
        batchNo: b.batchNo,
        qty: b.qty,
        expiredAt: b.expiredAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/barang — SKU dibuat otomatis per kategori. */
export async function tambahBarang(req, res, next) {
  try {
    const nama = teksWajib(req.body?.nama, 'Nama barang', 150);
    const kategoriId = teksWajib(req.body?.kategoriId, 'Kategori', 40);
    const satuan = teksWajib(req.body?.satuan, 'Satuan', 20);
    const stokMin = angka(req.body?.stokMin ?? 0, 'Stok minimum', { min: 0 });
    const hargaBeli = bilanganBulat(req.body?.hargaBeli ?? 0, 'Harga beli', { min: 0 });
    const lokasiRak = teksOpsional(req.body?.lokasiRak, 30);
    const foto = req.body?.foto ? String(req.body.foto).slice(0, 500) : null;

    const hasil = await prisma.$transaction(async (tx) => {
      const kategori = await tx.kategori.findUnique({ where: { id: kategoriId } });
      if (!kategori) throw badRequest('Kategori tidak ditemukan.');

      const sku = await buatSkuOtomatis(tx, kategoriId);
      return tx.barang.create({
        data: {
          sku,
          nama,
          kategoriId,
          satuan,
          stokMin,
          hargaBeli,
          lokasiRak,
          foto,
          aktif: req.body?.aktif === undefined ? true : Boolean(req.body.aktif),
        },
        include: { kategori: true, batches: true },
      });
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'TAMBAH_BARANG',
      entitas: 'Barang',
      entitasId: hasil.id,
      detail: `Menambah barang ${hasil.sku} - ${hasil.nama}`,
    });

    res.status(201).json(bentukBarang(hasil));
  } catch (err) {
    next(err);
  }
}

/** PUT /api/barang/:id — SKU tidak diubah. */
export async function ubahBarang(req, res, next) {
  try {
    const target = await prisma.barang.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('Barang tidak ditemukan.');

    const data = {};
    if (req.body?.nama !== undefined) data.nama = teksWajib(req.body.nama, 'Nama barang', 150);
    if (req.body?.kategoriId !== undefined) {
      const kategoriId = teksWajib(req.body.kategoriId, 'Kategori', 40);
      const kategori = await prisma.kategori.findUnique({ where: { id: kategoriId } });
      if (!kategori) throw badRequest('Kategori tidak ditemukan.');
      data.kategoriId = kategoriId;
    }
    if (req.body?.satuan !== undefined) data.satuan = teksWajib(req.body.satuan, 'Satuan', 20);
    if (req.body?.stokMin !== undefined) {
      data.stokMin = angka(req.body.stokMin, 'Stok minimum', { min: 0 });
    }
    if (req.body?.hargaBeli !== undefined) {
      data.hargaBeli = bilanganBulat(req.body.hargaBeli, 'Harga beli', { min: 0 });
    }
    if (req.body?.lokasiRak !== undefined) data.lokasiRak = teksOpsional(req.body.lokasiRak, 30);
    if (req.body?.foto !== undefined) data.foto = req.body.foto ? String(req.body.foto) : null;
    if (req.body?.aktif !== undefined) data.aktif = Boolean(req.body.aktif);

    const hasil = await prisma.barang.update({
      where: { id: target.id },
      data,
      include: { kategori: true, batches: true },
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'UBAH_BARANG',
      entitas: 'Barang',
      entitasId: hasil.id,
      detail: `Mengubah barang ${hasil.sku} - ${hasil.nama}`,
    });

    res.json(bentukBarang(hasil));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/barang/:id — hanya kalau belum punya riwayat transaksi. */
export async function hapusBarang(req, res, next) {
  try {
    const target = await prisma.barang.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { items: true } }, batches: true },
    });
    if (!target) throw notFound('Barang tidak ditemukan.');

    if (target._count.items > 0) {
      throw conflict(
        `Barang "${target.nama}" sudah punya riwayat transaksi, jadi tidak bisa dihapus. Nonaktifkan saja supaya hilang dari pilihan.`,
      );
    }

    const adaStok = target.batches.some((b) => b.qty > 0);
    if (adaStok) {
      throw conflict('Barang ini masih punya stok. Kosongkan stoknya dulu sebelum dihapus.');
    }

    await prisma.barang.delete({ where: { id: target.id } });
    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'HAPUS_BARANG',
      entitas: 'Barang',
      entitasId: target.id,
      detail: `Menghapus barang ${target.sku} - ${target.nama}`,
    });

    res.json({ message: 'Barang dihapus.' });
  } catch (err) {
    next(err);
  }
}
