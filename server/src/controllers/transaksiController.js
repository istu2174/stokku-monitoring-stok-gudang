import { prisma } from '../lib/prisma.js';
import { catatAudit } from '../lib/audit.js';
import { boleh, STATUS, TIPE_TRANSAKSI } from '../lib/roles.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';
import { kurangiFEFO, tambahKeBatch, totalStok } from '../services/stokService.js';
import {
  angka,
  bilanganBulat,
  pageLimit,
  salahSatuDari,
  tanggalOpsional,
  tanggalWajib,
  teksOpsional,
  teksWajib,
} from '../utils/validasi.js';

const PREFIX_DOKUMEN = {
  MASUK: 'IN',
  KELUAR: 'OUT',
  PENYESUAIAN: 'OP',
};

/** Nomor dokumen otomatis: IN-20261117-001 */
async function nomorDokumenOtomatis(db, tipe) {
  const sekarang = new Date();
  const tanggal = `${sekarang.getFullYear()}${String(sekarang.getMonth() + 1).padStart(2, '0')}${String(
    sekarang.getDate(),
  ).padStart(2, '0')}`;
  const awalan = `${PREFIX_DOKUMEN[tipe]}-${tanggal}-`;

  const terakhir = await db.transaksiStok.findFirst({
    where: { noDokumen: { startsWith: awalan } },
    orderBy: { noDokumen: 'desc' },
    select: { noDokumen: true },
  });

  let urutan = 1;
  if (terakhir?.noDokumen) {
    const angkaTerakhir = Number(terakhir.noDokumen.split('-')[2]);
    if (Number.isFinite(angkaTerakhir)) urutan = angkaTerakhir + 1;
  }
  return `${awalan}${String(urutan).padStart(3, '0')}`;
}

/** Validasi array item transaksi dan ambil data barangnya sekaligus. */
async function siapkanItem(db, items, { butuhHarga = false, butuhBatch = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Minimal satu barang harus diisi.');
  }
  if (items.length > 100) throw badRequest('Maksimal 100 baris barang per transaksi.');

  const hasil = [];
  for (const [index, mentah] of items.entries()) {
    const urut = index + 1;
    const barangId = teksWajib(mentah?.barangId, `Barang baris ${urut}`, 40);
    const barang = await db.barang.findUnique({ where: { id: barangId } });
    if (!barang) throw badRequest(`Barang baris ${urut} tidak ditemukan.`);
    if (!barang.aktif) throw badRequest(`Barang "${barang.nama}" sudah dinonaktifkan.`);

    const qty = angka(mentah?.qty, `Qty "${barang.nama}"`, { min: 0.0001 });
    hasil.push({
      barang,
      qty,
      harga: butuhHarga
        ? bilanganBulat(mentah?.harga ?? barang.hargaBeli, `Harga "${barang.nama}"`, { min: 0 })
        : null,
      batchNo: butuhBatch ? teksOpsional(mentah?.batchNo, 40) || '-' : '-',
      expiredAt: butuhBatch ? tanggalOpsional(mentah?.expiredAt, 'Tanggal expired') : null,
    });
  }
  return hasil;
}

/** GET /api/transaksi — riwayat semua tipe, bisa difilter. */
export async function daftarTransaksi(req, res, next) {
  try {
    const { tipe, status, dari, ke, q } = req.query;
    const { page, limit, skip } = pageLimit(req.query, 10);

    const where = {};
    if (tipe) where.tipe = salahSatuDari(tipe, Object.values(TIPE_TRANSAKSI), 'Tipe');
    if (status) where.status = salahSatuDari(status, Object.values(STATUS), 'Status');
    if (dari || ke) {
      where.tanggal = {
        ...(dari ? { gte: new Date(String(dari)) } : {}),
        ...(ke ? { lte: new Date(`${String(ke)}T23:59:59`) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { noDokumen: { contains: String(q) } },
        { tujuan: { contains: String(q) } },
        { alasan: { contains: String(q) } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.transaksiStok.findMany({
        where,
        include: {
          supplier: true,
          dibuatOleh: { select: { id: true, nama: true } },
          disetujuiOleh: { select: { id: true, nama: true } },
          items: { include: { barang: { select: { id: true, sku: true, nama: true, satuan: true } } } },
        },
        orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.transaksiStok.count({ where }),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/transaksi/:id */
export async function detailTransaksi(req, res, next) {
  try {
    const transaksi = await prisma.transaksiStok.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        dibuatOleh: { select: { id: true, nama: true, role: true } },
        disetujuiOleh: { select: { id: true, nama: true, role: true } },
        items: {
          include: {
            barang: { select: { id: true, sku: true, nama: true, satuan: true } },
            batch: true,
          },
        },
      },
    });
    if (!transaksi) throw notFound('Transaksi tidak ditemukan.');
    res.json(transaksi);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transaksi/masuk
 * Barang masuk langsung menambah stok (tanpa approval), sesuai PRD.
 */
export async function buatMasuk(req, res, next) {
  try {
    const tanggal = tanggalWajib(req.body?.tanggal ?? new Date(), 'Tanggal');
    const supplierId = req.body?.supplierId ? String(req.body.supplierId) : null;
    const catatanDokumen = teksOpsional(req.body?.noDokumen, 60);
    const tujuan = teksOpsional(req.body?.tujuan, 200);

    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) throw badRequest('Supplier tidak ditemukan.');
    }

    const transaksi = await prisma.$transaction(async (tx) => {
      const item = await siapkanItem(tx, req.body?.items, { butuhHarga: true, butuhBatch: true });
      const noDokumen = catatanDokumen || (await nomorDokumenOtomatis(tx, TIPE_TRANSAKSI.MASUK));

      const dibuat = await tx.transaksiStok.create({
        data: {
          tipe: TIPE_TRANSAKSI.MASUK,
          status: STATUS.DISETUJUI, // masuk langsung disetujui
          tanggal,
          supplierId,
          noDokumen,
          tujuan,
          dibuatOlehId: req.user.id,
          disetujuiOlehId: req.user.id,
          approvedAt: new Date(),
        },
      });

      for (const baris of item) {
        const batch = await tambahKeBatch(tx, {
          barangId: baris.barang.id,
          batchNo: baris.batchNo,
          expiredAt: baris.expiredAt,
          qty: baris.qty,
        });

        await tx.itemTransaksi.create({
          data: {
            transaksiId: dibuat.id,
            barangId: baris.barang.id,
            batchId: batch.id,
            qty: baris.qty,
            harga: baris.harga,
          },
        });

        // Harga beli terakhir dipakai sebagai harga acuan barang
        if (baris.harga && baris.harga !== baris.barang.hargaBeli) {
          await tx.barang.update({
            where: { id: baris.barang.id },
            data: { hargaBeli: baris.harga },
          });
        }
      }

      return dibuat;
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'BARANG_MASUK',
      entitas: 'TransaksiStok',
      entitasId: transaksi.id,
      detail: `Barang masuk ${transaksi.noDokumen} (${req.body.items.length} baris)`,
    });

    res.status(201).json({ message: 'Barang masuk tersimpan, stok sudah bertambah.', id: transaksi.id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transaksi/keluar
 * Pengajuan barang keluar; stok baru berkurang setelah disetujui.
 */
export async function buatKeluar(req, res, next) {
  try {
    const tanggal = tanggalWajib(req.body?.tanggal ?? new Date(), 'Tanggal');
    const tujuan = teksWajib(req.body?.tujuan, 'Tujuan pengambilan', 200);
    const catatanDokumen = teksOpsional(req.body?.noDokumen, 60);

    const transaksi = await prisma.$transaction(async (tx) => {
      const item = await siapkanItem(tx, req.body?.items);

      // Cek stok sekarang supaya pengaju tahu kalau stok tidak cukup
      for (const baris of item) {
        const stok = await totalStok(tx, baris.barang.id);
        if (stok + 1e-9 < baris.qty) {
          throw badRequest(
            `Stok "${baris.barang.nama}" tidak cukup. Tersedia ${stok} ${baris.barang.satuan}, diminta ${baris.qty}.`,
          );
        }
      }

      const noDokumen = catatanDokumen || (await nomorDokumenOtomatis(tx, TIPE_TRANSAKSI.KELUAR));
      const dibuat = await tx.transaksiStok.create({
        data: {
          tipe: TIPE_TRANSAKSI.KELUAR,
          status: STATUS.MENUNGGU,
          tanggal,
          noDokumen,
          tujuan,
          dibuatOlehId: req.user.id,
        },
      });

      for (const baris of item) {
        await tx.itemTransaksi.create({
          data: {
            transaksiId: dibuat.id,
            barangId: baris.barang.id,
            qty: baris.qty,
          },
        });
      }

      return dibuat;
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'AJUKAN_KELUAR',
      entitas: 'TransaksiStok',
      entitasId: transaksi.id,
      detail: `Pengajuan barang keluar ${transaksi.noDokumen} - ${tujuan}`,
    });

    res.status(201).json({
      message: 'Pengajuan barang keluar terkirim, menunggu persetujuan.',
      id: transaksi.id,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transaksi/opname
 * Stock opname: input stok fisik, selisihnya menunggu approval.
 */
export async function buatOpname(req, res, next) {
  try {
    const tanggal = tanggalWajib(req.body?.tanggal ?? new Date(), 'Tanggal');
    const alasan = teksWajib(req.body?.alasan, 'Alasan penyesuaian', 300);
    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      throw badRequest('Minimal satu barang harus diisi.');
    }
    if (items.length > 100) throw badRequest('Maksimal 100 baris barang per opname.');

    const transaksi = await prisma.$transaction(async (tx) => {
      const noDokumen = await nomorDokumenOtomatis(tx, TIPE_TRANSAKSI.PENYESUAIAN);
      const dibuat = await tx.transaksiStok.create({
        data: {
          tipe: TIPE_TRANSAKSI.PENYESUAIAN,
          status: STATUS.MENUNGGU,
          tanggal,
          noDokumen,
          alasan,
          dibuatOlehId: req.user.id,
        },
      });

      let adaSelisih = false;
      for (const [index, mentah] of items.entries()) {
        const barangId = teksWajib(mentah?.barangId, `Barang baris ${index + 1}`, 40);
        const barang = await tx.barang.findUnique({ where: { id: barangId } });
        if (!barang) throw badRequest(`Barang baris ${index + 1} tidak ditemukan.`);

        const stokSistem = await totalStok(tx, barang.id);
        const stokFisik = angka(mentah?.stokFisik, `Stok fisik "${barang.nama}"`, { min: 0 });
        const selisih = stokFisik - stokSistem;
        if (Math.abs(selisih) > 1e-9) adaSelisih = true;

        await tx.itemTransaksi.create({
          data: {
            transaksiId: dibuat.id,
            barangId: barang.id,
            qty: selisih,
            stokSistem,
            stokFisik,
          },
        });
      }

      if (!adaSelisih) {
        throw conflict('Tidak ada selisih stok, jadi tidak perlu penyesuaian.');
      }

      return dibuat;
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'AJUKAN_OPNAME',
      entitas: 'TransaksiStok',
      entitasId: transaksi.id,
      detail: `Pengajuan penyesuaian ${transaksi.noDokumen} - ${alasan}`,
    });

    res.status(201).json({
      message: 'Pengajuan penyesuaian terkirim, menunggu persetujuan.',
      id: transaksi.id,
    });
  } catch (err) {
    next(err);
  }
}

/** Cek siapa yang boleh menyetujui transaksi tertentu. */
function izinApprove(tipe) {
  if (tipe === TIPE_TRANSAKSI.KELUAR) return 'approveKeluar';
  if (tipe === TIPE_TRANSAKSI.PENYESUAIAN) return 'opnameApprove';
  return null;
}

/**
 * PUT /api/transaksi/:id/approve
 * Barang keluar → kurangi stok FEFO. Penyesuaian → samakan stok dengan hasil hitung fisik.
 */
export async function approveTransaksi(req, res, next) {
  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const transaksi = await tx.transaksiStok.findUnique({
        where: { id: req.params.id },
        include: { items: { include: { barang: true } } },
      });
      if (!transaksi) throw notFound('Transaksi tidak ditemukan.');

      const izin = izinApprove(transaksi.tipe);
      if (!izin) throw badRequest('Transaksi tipe ini tidak butuh persetujuan.');
      if (!boleh(req.user.role, izin)) {
        throw forbidden('Role kamu tidak berhak menyetujui transaksi ini.');
      }
      if (transaksi.status !== STATUS.MENUNGGU) {
        throw conflict(`Transaksi ini sudah ${transaksi.status.toLowerCase()}.`);
      }

      for (const item of transaksi.items) {
        if (transaksi.tipe === TIPE_TRANSAKSI.KELUAR) {
          await kurangiFEFO(tx, item.barangId, item.qty, item.barang.nama);
        } else {
          // Hitung ulang stok saat approval supaya hasil akhir = stok fisik
          const stokSekarang = await totalStok(tx, item.barangId);
          const selisih = (item.stokFisik ?? stokSekarang) - stokSekarang;

          if (selisih > 1e-9) {
            await tambahKeBatch(tx, { barangId: item.barangId, batchNo: '-', qty: selisih });
          } else if (selisih < -1e-9) {
            await kurangiFEFO(tx, item.barangId, Math.abs(selisih), item.barang.nama);
          }

          await tx.itemTransaksi.update({
            where: { id: item.id },
            data: { qty: selisih, stokSistem: stokSekarang },
          });
        }
      }

      return tx.transaksiStok.update({
        where: { id: transaksi.id },
        data: {
          status: STATUS.DISETUJUI,
          disetujuiOlehId: req.user.id,
          approvedAt: new Date(),
        },
      });
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'APPROVE_TRANSAKSI',
      entitas: 'TransaksiStok',
      entitasId: hasil.id,
      detail: `Menyetujui ${hasil.tipe} ${hasil.noDokumen}`,
    });

    res.json({ message: 'Transaksi disetujui, stok sudah diperbarui.', id: hasil.id });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/transaksi/:id/tolak */
export async function tolakTransaksi(req, res, next) {
  try {
    const catatanTolak = teksWajib(req.body?.catatanTolak, 'Alasan penolakan', 300);

    const transaksi = await prisma.transaksiStok.findUnique({ where: { id: req.params.id } });
    if (!transaksi) throw notFound('Transaksi tidak ditemukan.');

    const izin = izinApprove(transaksi.tipe);
    if (!izin) throw badRequest('Transaksi tipe ini tidak butuh persetujuan.');
    if (!boleh(req.user.role, izin)) {
      throw forbidden('Role kamu tidak berhak menolak transaksi ini.');
    }
    if (transaksi.status !== STATUS.MENUNGGU) {
      throw conflict(`Transaksi ini sudah ${transaksi.status.toLowerCase()}.`);
    }

    await prisma.transaksiStok.update({
      where: { id: transaksi.id },
      data: {
        status: STATUS.DITOLAK,
        disetujuiOlehId: req.user.id,
        approvedAt: new Date(),
        catatanTolak,
      },
    });

    await catatAudit(prisma, {
      userId: req.user.id,
      aksi: 'TOLAK_TRANSAKSI',
      entitas: 'TransaksiStok',
      entitasId: transaksi.id,
      detail: `Menolak ${transaksi.tipe} ${transaksi.noDokumen}: ${catatanTolak}`,
    });

    res.json({ message: 'Transaksi ditolak.' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/transaksi/menunggu — jumlah & daftar yang perlu approval (untuk badge). */
export async function daftarMenunggu(req, res, next) {
  try {
    const items = await prisma.transaksiStok.findMany({
      where: { status: STATUS.MENUNGGU },
      include: {
        dibuatOleh: { select: { id: true, nama: true } },
        items: { include: { barang: { select: { nama: true, satuan: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}
