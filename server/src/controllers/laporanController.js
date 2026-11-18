import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { ringkasBatch } from './barangController.js';
import { urutkanFEFO } from '../services/stokService.js';
import { STATUS } from '../lib/roles.js';

/** Format nilai & tanggal untuk laporan. */
function tglIndonesia(nilai) {
  if (!nilai) return '-';
  const d = new Date(nilai);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function rupiah(nilai) {
  return Number(nilai || 0).toLocaleString('id-ID');
}

/** Susun data stok semua barang (dipakai beberapa laporan). */
async function dataStok({ kategoriId, status } = {}) {
  const where = {};
  if (kategoriId) where.kategoriId = String(kategoriId);

  const daftar = await prisma.barang.findMany({
    where,
    include: { kategori: true, batches: true },
    orderBy: { nama: 'asc' },
  });

  let baris = daftar.map((b) => {
    const { stok, expiredTerdekat } = ringkasBatch(b.batches);
    const statusStok = stok <= 0 ? 'HABIS' : stok <= b.stokMin ? 'MENIPIS' : 'AMAN';
    return {
      sku: b.sku,
      nama: b.nama,
      kategori: `${b.kategori.ikon} ${b.kategori.nama}`,
      satuan: b.satuan,
      stok,
      stokMin: b.stokMin,
      status: statusStok,
      lokasiRak: b.lokasiRak || '-',
      hargaBeli: b.hargaBeli,
      nilaiStok: stok * b.hargaBeli,
      expiredTerdekat: tglIndonesia(expiredTerdekat),
    };
  });

  if (status) baris = baris.filter((b) => b.status === String(status).toUpperCase());
  return baris;
}

const KOLOM_STOK = [
  { key: 'sku', header: 'SKU', width: 14 },
  { key: 'nama', header: 'Nama Barang', width: 32 },
  { key: 'kategori', header: 'Kategori', width: 28 },
  { key: 'satuan', header: 'Satuan', width: 10 },
  { key: 'stok', header: 'Stok', width: 10 },
  { key: 'stokMin', header: 'Stok Min', width: 10 },
  { key: 'status', header: 'Status', width: 10 },
  { key: 'lokasiRak', header: 'Lokasi Rak', width: 14 },
  { key: 'hargaBeli', header: 'Harga Beli', width: 14 },
  { key: 'nilaiStok', header: 'Nilai Stok', width: 16 },
  { key: 'expiredTerdekat', header: 'Expired Terdekat', width: 16 },
];

/**
 * Kirim hasil laporan sesuai format: json (default), csv, atau xlsx.
 * Satu fungsi dipakai semua jenis laporan supaya formatnya konsisten.
 */
async function kirimLaporan(res, { namaFile, judul, kolom, baris, format }) {
  if (format === 'csv') {
    const header = kolom.map((k) => `"${k.header}"`).join(',');
    const isi = baris.map((b) =>
      kolom
        .map((k) => {
          const nilai = b[k.key] ?? '';
          return typeof nilai === 'number' ? nilai : `"${String(nilai).replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    // BOM supaya Excel membaca huruf beraksen dengan benar
    const csv = `\uFEFF${[header, ...isi].join('\r\n')}`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${namaFile}.csv"`);
    return res.send(csv);
  }

  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'StokKu';
    wb.created = new Date();
    // Nama sheet Excel tidak boleh mengandung karakter khusus
    const namaSheet = judul.replace(/[*?:\\/[\]]/g, '-').slice(0, 30);
    const ws = wb.addWorksheet(namaSheet);

    ws.mergeCells(1, 1, 1, kolom.length);
    ws.getCell('A1').value = judul;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells(2, 1, 2, kolom.length);
    ws.getCell('A2').value = `Dibuat: ${tglIndonesia(new Date())}`;
    ws.getCell('A2').font = { size: 10, color: { argb: 'FF666666' } };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    const barisHeader = ws.getRow(4);
    kolom.forEach((k, i) => {
      const cell = barisHeader.getCell(i + 1);
      cell.value = k.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getColumn(i + 1).width = k.width;
    });
    barisHeader.commit();

    baris.forEach((b, index) => {
      const row = ws.addRow(kolom.map((k) => b[k.key] ?? ''));
      row.getCell(1).alignment = { vertical: 'middle' };
      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        });
      }
    });

    ws.views = [{ state: 'frozen', ySplit: 4 }];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${namaFile}.xlsx"`);
    await wb.xlsx.write(res);
    return res.end();
  }

  return res.json({
    judul,
    kolom: kolom.map((k) => ({ key: k.key, header: k.header })),
    items: baris,
    total: baris.length,
  });
}

/** GET /api/laporan/stok?format=&kategoriId=&status= */
export async function laporanStok(req, res, next) {
  try {
    const baris = await dataStok(req.query);
    await kirimLaporan(res, {
      namaFile: 'laporan-stok',
      judul: 'Laporan Stok Barang',
      kolom: KOLOM_STOK,
      baris,
      format: req.query.format,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/laporan/menipis?format= — stok menipis & habis. */
export async function laporanMenipis(req, res, next) {
  try {
    const baris = (await dataStok()).filter((b) => b.status !== 'AMAN');
    await kirimLaporan(res, {
      namaFile: 'laporan-stok-menipis',
      judul: 'Laporan Stok Menipis & Habis',
      kolom: KOLOM_STOK,
      baris,
      format: req.query.format,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/laporan/nilai?format= — rekap nilai persediaan per kategori. */
export async function laporanNilai(req, res, next) {
  try {
    const baris = await dataStok();
    const perKategori = new Map();

    for (const b of baris) {
      const kunci = b.kategori;
      const sekarang = perKategori.get(kunci) || {
        kategori: kunci,
        jumlahBarang: 0,
        totalUnit: 0,
        nilaiStok: 0,
      };
      sekarang.jumlahBarang += 1;
      sekarang.totalUnit += b.stok;
      sekarang.nilaiStok += b.nilaiStok;
      perKategori.set(kunci, sekarang);
    }

    const items = [...perKategori.values()]
      .map((k) => ({ ...k, nilaiStok: rupiah(k.nilaiStok) }))
      .sort((a, b) => Number(b.nilaiStok.replace(/\./g, '')) - Number(a.nilaiStok.replace(/\./g, '')));

    await kirimLaporan(res, {
      namaFile: 'laporan-nilai-persediaan',
      judul: 'Rekap Nilai Persediaan per Kategori',
      kolom: [
        { key: 'kategori', header: 'Kategori', width: 32 },
        { key: 'jumlahBarang', header: 'Jumlah Barang', width: 14 },
        { key: 'totalUnit', header: 'Total Unit', width: 14 },
        { key: 'nilaiStok', header: 'Nilai Stok (Rp)', width: 18 },
      ],
      baris: items,
      format: req.query.format,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/laporan/mutasi?dari=&ke=&tipe=&format=
 * Riwayat barang masuk/keluar yang sudah disetujui.
 */
export async function laporanMutasi(req, res, next) {
  try {
    const { dari, ke, tipe } = req.query;
    const where = { status: STATUS.DISETUJUI };
    if (tipe) where.tipe = String(tipe).toUpperCase();
    if (dari || ke) {
      where.tanggal = {
        ...(dari ? { gte: new Date(String(dari)) } : {}),
        ...(ke ? { lte: new Date(`${String(ke)}T23:59:59`) } : {}),
      };
    }

    const transaksi = await prisma.transaksiStok.findMany({
      where,
      include: {
        supplier: true,
        dibuatOleh: { select: { nama: true } },
        items: { include: { barang: true, batch: true } },
      },
      orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }],
    });

    const baris = [];
    for (const t of transaksi) {
      for (const it of t.items) {
        baris.push({
          tanggal: tglIndonesia(t.tanggal),
          noDokumen: t.noDokumen || '-',
          tipe: t.tipe,
          sku: it.barang.sku,
          nama: it.barang.nama,
          batch: it.batch?.batchNo || '-',
          qty: it.qty,
          satuan: it.barang.satuan,
          harga: it.harga ?? '',
          nilai: it.harga ? it.harga * it.qty : '',
          keterangan: t.supplier?.nama || t.tujuan || t.alasan || '-',
          oleh: t.dibuatOleh?.nama || '-',
        });
      }
    }

    await kirimLaporan(res, {
      namaFile: 'laporan-mutasi-stok',
      judul: 'Laporan Mutasi Stok (Masuk / Keluar)',
      kolom: [
        { key: 'tanggal', header: 'Tanggal', width: 12 },
        { key: 'noDokumen', header: 'No. Dokumen', width: 20 },
        { key: 'tipe', header: 'Tipe', width: 12 },
        { key: 'sku', header: 'SKU', width: 14 },
        { key: 'nama', header: 'Nama Barang', width: 30 },
        { key: 'batch', header: 'Batch', width: 12 },
        { key: 'qty', header: 'Qty', width: 10 },
        { key: 'satuan', header: 'Satuan', width: 10 },
        { key: 'harga', header: 'Harga', width: 14 },
        { key: 'nilai', header: 'Nilai', width: 16 },
        { key: 'keterangan', header: 'Keterangan', width: 28 },
        { key: 'oleh', header: 'Dicatat Oleh', width: 18 },
      ],
      baris,
      format: req.query.format,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/laporan/expired?format= — batch yang sudah/akan kedaluwarsa. */
export async function laporanExpired(req, res, next) {
  try {
    const batches = await prisma.batchStok.findMany({
      where: { qty: { gt: 0 }, expiredAt: { not: null } },
      include: { barang: { include: { kategori: true } } },
    });

    const sekarang = Date.now();
    const baris = urutkanFEFO(batches).map((b) => {
      const selisihHari = Math.ceil((new Date(b.expiredAt).getTime() - sekarang) / 86400000);
      return {
        sku: b.barang.sku,
        nama: b.barang.nama,
        kategori: `${b.barang.kategori.ikon} ${b.barang.kategori.nama}`,
        batchNo: b.batchNo,
        qty: b.qty,
        satuan: b.barang.satuan,
        expiredAt: tglIndonesia(b.expiredAt),
        sisaHari: selisihHari,
        status: selisihHari < 0 ? 'KEDALUWARSA' : selisihHari <= 30 ? 'SEGERA' : 'AMAN',
      };
    });

    await kirimLaporan(res, {
      namaFile: 'laporan-expired',
      judul: 'Laporan Barang Kedaluwarsa',
      kolom: [
        { key: 'sku', header: 'SKU', width: 14 },
        { key: 'nama', header: 'Nama Barang', width: 30 },
        { key: 'kategori', header: 'Kategori', width: 28 },
        { key: 'batchNo', header: 'Batch', width: 14 },
        { key: 'qty', header: 'Qty', width: 10 },
        { key: 'satuan', header: 'Satuan', width: 10 },
        { key: 'expiredAt', header: 'Expired', width: 14 },
        { key: 'sisaHari', header: 'Sisa Hari', width: 12 },
        { key: 'status', header: 'Status', width: 16 },
      ],
      baris,
      format: req.query.format,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/laporan/transaksi/:id — detail satu transaksi (untuk cetak). */
export async function detailUntukCetak(req, res, next) {
  try {
    const transaksi = await prisma.transaksiStok.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        dibuatOleh: { select: { nama: true } },
        disetujuiOleh: { select: { nama: true } },
        items: { include: { barang: true, batch: true } },
      },
    });
    if (!transaksi) throw notFound('Transaksi tidak ditemukan.');
    res.json(transaksi);
  } catch (err) {
    next(err);
  }
}
