import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { ringkasBatch } from './barangController.js';

/**
 * GET /api/barang/:id/kartu-stok?dari=&ke=
 * Riwayat pergerakan stok satu barang + saldo berjalan.
 * Hanya transaksi yang sudah DISETUJUI yang mengubah stok.
 */
export async function kartuStok(req, res, next) {
  try {
    const barang = await prisma.barang.findUnique({
      where: { id: req.params.id },
      include: { kategori: true, batches: true },
    });
    if (!barang) throw notFound('Barang tidak ditemukan.');

    const where = { barangId: barang.id, transaksi: { status: 'DISETUJUI' } };
    const { dari, ke } = req.query;
    if (dari || ke) {
      where.transaksi.tanggal = {
        ...(dari ? { gte: new Date(String(dari)) } : {}),
        ...(ke ? { lte: new Date(`${String(ke)}T23:59:59`) } : {}),
      };
    }

    const items = await prisma.itemTransaksi.findMany({
      where,
      include: {
        transaksi: { include: { supplier: true, dibuatOleh: true, disetujuiOleh: true } },
        batch: true,
      },
      orderBy: [{ transaksi: { tanggal: 'asc' } }, { id: 'asc' }],
    });

    let saldo = 0;
    const baris = items.map((it) => {
      const tipe = it.transaksi.tipe;
      let masuk = 0;
      let keluar = 0;

      if (tipe === 'MASUK') masuk = it.qty;
      else if (tipe === 'KELUAR') keluar = it.qty;
      else if (it.qty >= 0) masuk = it.qty;
      else keluar = Math.abs(it.qty);

      saldo = saldo + masuk - keluar;

      return {
        id: it.id,
        tanggal: it.transaksi.tanggal,
        tipe,
        noDokumen: it.transaksi.noDokumen,
        batchNo: it.batch?.batchNo || '-',
        expiredAt: it.batch?.expiredAt || null,
        masuk,
        keluar,
        saldo,
        keterangan:
          tipe === 'PENYESUAIAN'
            ? `Opname: sistem ${it.stokSistem}, fisik ${it.stokFisik}`
            : tipe === 'MASUK'
              ? it.transaksi.supplier?.nama || it.transaksi.tujuan || ''
              : it.transaksi.tujuan || '',
        oleh: it.transaksi.dibuatOleh?.nama || '-',
      };
    });

    const { stok, expiredTerdekat } = ringkasBatch(barang.batches);

    res.json({
      barang: {
        id: barang.id,
        sku: barang.sku,
        nama: barang.nama,
        satuan: barang.satuan,
        kategori: barang.kategori,
        stok,
        stokMin: barang.stokMin,
        expiredTerdekat,
      },
      items: baris,
      saldoAkhir: saldo,
    });
  } catch (err) {
    next(err);
  }
}
