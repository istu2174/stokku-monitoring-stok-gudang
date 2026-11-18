import { prisma } from '../lib/prisma.js';
import { boleh } from '../lib/roles.js';
import { pageLimit } from '../utils/validasi.js';

const HARI_INI = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * GET /api/dashboard
 * Ringkasan untuk halaman utama. Staf gudang hanya dapat versi ringkas
 * (tanpa nilai persediaan & tren), sesuai matriks hak akses.
 */
export async function ringkasanDashboard(req, res, next) {
  try {
    const bolehLaporan = boleh(req.user.role, 'lihatLaporan');

    const [semuaBarang, transaksiTerbaru, menunggu] = await Promise.all([
      prisma.barang.findMany({
        where: { aktif: true },
        include: { kategori: true, batches: true },
      }),
      prisma.transaksiStok.findMany({
        take: 8,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          dibuatOleh: { select: { nama: true } },
          items: { include: { barang: { select: { nama: true, satuan: true } } } },
        },
      }),
      prisma.transaksiStok.count({ where: { status: 'MENUNGGU' } }),
    ]);

    const sekarang = Date.now();
    const batasExpired = sekarang + 30 * 86400000;

    let nilaiPersediaan = 0;
    const menipis = [];
    const akanExpired = [];
    const perKategori = new Map();

    for (const barang of semuaBarang) {
      const stok = barang.batches.reduce((total, b) => total + b.qty, 0);
      const status = stok <= 0 ? 'HABIS' : stok <= barang.stokMin ? 'MENIPIS' : 'AMAN';
      nilaiPersediaan += stok * barang.hargaBeli;

      const ringkas = {
        id: barang.id,
        sku: barang.sku,
        nama: barang.nama,
        satuan: barang.satuan,
        stok,
        stokMin: barang.stokMin,
        status,
        kategori: `${barang.kategori.ikon} ${barang.kategori.nama}`,
      };
      if (status !== 'AMAN') menipis.push(ringkas);

      for (const batch of barang.batches) {
        if (batch.qty <= 0 || !batch.expiredAt) continue;
        const waktu = new Date(batch.expiredAt).getTime();
        if (waktu <= batasExpired) {
          akanExpired.push({
            ...ringkas,
            batchNo: batch.batchNo,
            qtyBatch: batch.qty,
            expiredAt: batch.expiredAt,
            sisaHari: Math.ceil((waktu - sekarang) / 86400000),
          });
        }
      }

      const kunci = `${barang.kategori.ikon} ${barang.kategori.nama}`;
      const kategori = perKategori.get(kunci) || { kategori: kunci, jumlahBarang: 0, totalUnit: 0 };
      kategori.jumlahBarang += 1;
      kategori.totalUnit += stok;
      perKategori.set(kunci, kategori);
    }

    menipis.sort((a, b) => a.stok - b.stok);
    akanExpired.sort((a, b) => new Date(a.expiredAt) - new Date(b.expiredAt));

    // Tren 14 hari terakhir: nilai (Rp) barang masuk vs keluar per hari
    const awal = HARI_INI();
    awal.setDate(awal.getDate() - 13);

    const itemsMutasi = await prisma.itemTransaksi.findMany({
      where: {
        transaksi: { status: 'DISETUJUI', tanggal: { gte: awal } },
      },
      include: {
        transaksi: { select: { tipe: true, tanggal: true } },
        barang: { select: { hargaBeli: true } },
      },
    });

    const tren = new Map();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(awal);
      d.setDate(awal.getDate() + i);
      const kunci = d.toISOString().slice(0, 10);
      tren.set(kunci, { tanggal: kunci, masuk: 0, keluar: 0 });
    }
    for (const it of itemsMutasi) {
      const kunci = new Date(it.transaksi.tanggal).toISOString().slice(0, 10);
      const baris = tren.get(kunci);
      if (!baris) continue;
      // Nilai rupiah supaya masuk & keluar bisa dibandingkan walau satuannya beda
      const nilai = it.qty * (it.harga ?? it.barang?.hargaBeli ?? 0);
      if (it.transaksi.tipe === 'MASUK') baris.masuk += nilai;
      else if (it.transaksi.tipe === 'KELUAR') baris.keluar += nilai;
    }

    const habis = menipis.filter((b) => b.status === 'HABIS').length;

    res.json({
      ringkas: {
        totalBarang: semuaBarang.length,
        totalKategori: perKategori.size,
        stokMenipis: menipis.length - habis,
        stokHabis: habis,
        akanExpired: akanExpired.filter((b) => b.sisaHari >= 0).length,
        sudahExpired: akanExpired.filter((b) => b.sisaHari < 0).length,
        menungguApproval: menunggu,
        ...(bolehLaporan ? { nilaiPersediaan } : {}),
      },
      menipis: menipis.slice(0, 10),
      akanExpired: akanExpired.slice(0, 10),
      aktivitas: transaksiTerbaru.map((t) => ({
        id: t.id,
        tipe: t.tipe,
        status: t.status,
        tanggal: t.tanggal,
        noDokumen: t.noDokumen,
        oleh: t.dibuatOleh?.nama || '-',
        jumlahItem: t.items.length,
        ringkasItem: t.items
          .slice(0, 3)
          .map((it) => `${it.barang.nama} ${it.qty} ${it.barang.satuan}`)
          .join(', '),
      })),
      distribusiKategori: [...perKategori.values()].sort((a, b) => b.totalUnit - a.totalUnit),
      ...(bolehLaporan ? { tren: [...tren.values()] } : {}),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/dashboard/audit — potongan audit log terbaru untuk halaman dashboard. */
export async function auditTerbaru(req, res, next) {
  try {
    const { limit } = pageLimit({ limit: req.query.limit || 10 }, 10);
    const items = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { waktu: 'desc' },
      include: { user: { select: { nama: true, role: true } } },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}
