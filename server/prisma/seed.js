/**
 * Seed data contoh StokKu.
 * Jalankan: npm run db:seed (dari root) atau node prisma/seed.js (dari folder server).
 * Aman dijalankan berkali-kali: semua data lama dihapus dulu.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Tanggal relatif hari ini (negatif = hari lalu). */
function hariLalu(jumlahHari, jam = 9) {
  const d = new Date();
  d.setHours(jam, 0, 0, 0);
  d.setDate(d.getDate() + jumlahHari);
  return d;
}

const ROLE = {
  ADMIN: 'ADMIN_SISTEM',
  MANAJER: 'MANAJER',
  KEPALA: 'KEPALA',
  INVENTORI: 'ADMIN_INVENTORI',
  STAF: 'STAF',
  AUDITOR: 'AUDITOR',
};

const USERS = [
  { nama: 'Rani Admin Sistem', username: 'admin', email: 'admin@stokku.local', password: 'admin123', role: ROLE.ADMIN },
  { nama: 'Budi Manajer', username: 'manajer', email: 'manajer@stokku.local', password: 'manajer123', role: ROLE.MANAJER },
  { nama: 'Sari Kepala Gudang', username: 'kepala', email: 'kepala@stokku.local', password: 'kepala123', role: ROLE.KEPALA },
  { nama: 'Dito Admin Inventori', username: 'inventori', email: 'inventori@stokku.local', password: 'inventori123', role: ROLE.INVENTORI },
  { nama: 'Joko Staf Gudang', username: 'staf', email: 'staf@stokku.local', password: 'staf123', role: ROLE.STAF },
  { nama: 'Auditor Eksternal', username: 'auditor', email: 'auditor@stokku.local', password: 'auditor123', role: ROLE.AUDITOR },
];

const KATEGORI = [
  { nama: 'Makanan & Bahan Pokok', ikon: '🍚', warna: '#F59E0B' },
  { nama: 'Minuman', ikon: '🥤', warna: '#0EA5E9' },
  { nama: 'Elektronik', ikon: '💻', warna: '#6366F1' },
  { nama: 'Alat Tulis & Kantor', ikon: '📎', warna: '#8B5CF6' },
  { nama: 'Kebersihan & Kesehatan', ikon: '🧴', warna: '#14B8A6' },
  { nama: 'Peralatan Rumah Tangga', ikon: '🏠', warna: '#F97316' },
  { nama: 'Pakaian & Tekstil', ikon: '👕', warna: '#EC4899' },
  { nama: 'Bahan Bangunan', ikon: '🧱', warna: '#78716C' },
  { nama: 'Suku Cadang & Otomotif', ikon: '🔧', warna: '#EF4444' },
  { nama: 'Kemasan & Packaging', ikon: '📦', warna: '#22C55E' },
];

const SUPPLIER = [
  { nama: 'PT Sumber Pangan Sejahtera', kontak: '0812-1100-2233', alamat: 'Jl. Raya Cikarang No. 12, Bekasi' },
  { nama: 'CV Aneka Minuman Segar', kontak: '0813-4455-6677', alamat: 'Jl. Industri Kecil No. 8, Bandung' },
  { nama: 'PT Elektronik Jaya Abadi', kontak: '021-7788-9900', alamat: 'Kawasan Niaga Blok C5, Jakarta' },
  { nama: 'UD Kertas & Office Supply', kontak: '0857-2211-3344', alamat: 'Jl. Pasar Baru No. 45, Jakarta Pusat' },
  { nama: 'PT Bersih Sentosa', kontak: '0821-9988-1122', alamat: 'Jl. Gatot Subroto No. 90, Semarang' },
  { nama: 'Toko Bangunan Makmur', kontak: '0856-7788-1212', alamat: 'Jl. Raya Bogor Km 24, Depok' },
];

/**
 * Data barang + batch.
 * `masuk` = qty awal saat penerimaan, `keluar` = qty yang sudah diambil,
 * jadi stok akhir = masuk - keluar (atau dikoreksi opname).
 */
const BARANG = [
  {
    nama: 'Beras Premium 5kg',
    kategori: 'Makanan & Bahan Pokok',
    satuan: 'karung',
    stokMin: 10,
    harga: 65000,
    rak: 'A-1',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [
      { no: 'B-2601', qty: 30, exp: 45 },
      { no: 'B-2602', qty: 20, exp: 90 },
    ],
    keluar: 10,
  },
  {
    nama: 'Gula Pasir 1kg',
    kategori: 'Makanan & Bahan Pokok',
    satuan: 'pcs',
    stokMin: 20,
    harga: 16000,
    rak: 'A-2',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'G-2601', qty: 35, exp: 200 }],
  },
  {
    nama: 'Minyak Goreng 2L',
    kategori: 'Makanan & Bahan Pokok',
    satuan: 'pouch',
    stokMin: 15,
    harga: 34000,
    rak: 'A-3',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'MG-2601', qty: 15, exp: 12 }],
    keluar: 3,
  },
  {
    nama: 'Tepung Terigu 1kg',
    kategori: 'Makanan & Bahan Pokok',
    satuan: 'pcs',
    stokMin: 15,
    harga: 12000,
    rak: 'A-4',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'T-2601', qty: 48, exp: 150 }],
  },
  {
    nama: 'Mie Instan Goreng',
    kategori: 'Makanan & Bahan Pokok',
    satuan: 'dus',
    stokMin: 10,
    harga: 95000,
    rak: 'A-5',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'MI-2601', qty: 6, exp: 300 }],
  },
  {
    nama: 'Air Mineral 600ml',
    kategori: 'Minuman',
    satuan: 'dus',
    stokMin: 20,
    harga: 42000,
    rak: 'B-1',
    supplier: 'CV Aneka Minuman Segar',
    batches: [{ no: 'AM-2601', qty: 60, exp: 240 }],
    keluar: 5,
  },
  {
    nama: 'Teh Celup 25 Kantung',
    kategori: 'Minuman',
    satuan: 'box',
    stokMin: 12,
    harga: 9500,
    rak: 'B-2',
    supplier: 'CV Aneka Minuman Segar',
    batches: [{ no: 'TC-2601', qty: 8, exp: 180 }],
  },
  {
    nama: 'Kopi Sachet Renceng',
    kategori: 'Minuman',
    satuan: 'renceng',
    stokMin: 20,
    harga: 12000,
    rak: 'B-3',
    supplier: 'CV Aneka Minuman Segar',
    batches: [{ no: 'KP-2601', qty: 60, exp: 210 }],
  },
  {
    nama: 'Susu UHT 1 Liter',
    kategori: 'Minuman',
    satuan: 'karton',
    stokMin: 10,
    harga: 19000,
    rak: 'B-4',
    supplier: 'CV Aneka Minuman Segar',
    batches: [{ no: 'SU-2601', qty: 4, exp: -3 }],
  },
  {
    nama: 'Kabel Roll 5 Meter',
    kategori: 'Elektronik',
    satuan: 'pcs',
    stokMin: 5,
    harga: 85000,
    rak: 'C-1',
    supplier: 'PT Elektronik Jaya Abadi',
    batches: [{ no: 'KR-2601', qty: 14 }],
  },
  {
    nama: 'Lampu LED 12 Watt',
    kategori: 'Elektronik',
    satuan: 'pcs',
    stokMin: 10,
    harga: 27000,
    rak: 'C-2',
    supplier: 'PT Elektronik Jaya Abadi',
    batches: [{ no: 'LED-2601', qty: 9 }],
  },
  {
    nama: 'Baterai AA Isi 4',
    kategori: 'Elektronik',
    satuan: 'pak',
    stokMin: 15,
    harga: 15000,
    rak: 'C-3',
    supplier: 'PT Elektronik Jaya Abadi',
    batches: [{ no: 'BT-2601', qty: 40, exp: 700 }],
  },
  {
    nama: 'Kertas HVS A4 80gr',
    kategori: 'Alat Tulis & Kantor',
    satuan: 'rim',
    stokMin: 10,
    harga: 52000,
    rak: 'D-1',
    supplier: 'UD Kertas & Office Supply',
    batches: [{ no: 'KRT-2601', qty: 25 }],
  },
  {
    nama: 'Pulpen Hitam 0.5',
    kategori: 'Alat Tulis & Kantor',
    satuan: 'box',
    stokMin: 8,
    harga: 38000,
    rak: 'D-2',
    supplier: 'UD Kertas & Office Supply',
    batches: [{ no: 'PL-2601', qty: 3 }],
  },
  {
    nama: 'Tinta Printer Hitam',
    kategori: 'Alat Tulis & Kantor',
    satuan: 'botol',
    stokMin: 5,
    harga: 68000,
    rak: 'D-3',
    supplier: 'UD Kertas & Office Supply',
    batches: [{ no: 'TT-2601', qty: 2 }],
  },
  {
    nama: 'Sabun Cair 1 Liter',
    kategori: 'Kebersihan & Kesehatan',
    satuan: 'pcs',
    stokMin: 12,
    harga: 24000,
    rak: 'E-1',
    supplier: 'PT Bersih Sentosa',
    batches: [{ no: 'SB-2601', qty: 18, exp: 400 }],
  },
  {
    nama: 'Tisu Gulung',
    kategori: 'Kebersihan & Kesehatan',
    satuan: 'pack',
    stokMin: 20,
    harga: 18000,
    rak: 'E-2',
    supplier: 'PT Bersih Sentosa',
    batches: [{ no: 'TS-2601', qty: 45 }],
  },
  {
    nama: 'Masker Medis 3 Ply',
    kategori: 'Kebersihan & Kesehatan',
    satuan: 'box',
    stokMin: 10,
    harga: 30000,
    rak: 'E-3',
    supplier: 'PT Bersih Sentosa',
    batches: [{ no: 'MK-2601', qty: 7, exp: 400 }],
  },
  {
    nama: 'Ember Plastik 20 Liter',
    kategori: 'Peralatan Rumah Tangga',
    satuan: 'pcs',
    stokMin: 5,
    harga: 45000,
    rak: 'F-1',
    supplier: 'Toko Bangunan Makmur',
    batches: [{ no: 'EM-2601', qty: 12 }],
  },
  {
    nama: 'Sapu Ijuk Panjang',
    kategori: 'Peralatan Rumah Tangga',
    satuan: 'pcs',
    stokMin: 5,
    harga: 22000,
    rak: 'F-2',
    supplier: 'Toko Bangunan Makmur',
    batches: [{ no: 'SP-2601', qty: 6 }],
  },
  {
    nama: 'Kaos Seragam Kerja',
    kategori: 'Pakaian & Tekstil',
    satuan: 'pcs',
    stokMin: 10,
    harga: 55000,
    rak: 'G-1',
    supplier: 'CV Aneka Minuman Segar',
    batches: [{ no: 'KS-2601', qty: 22 }],
  },
  {
    nama: 'Semen Portland 50kg',
    kategori: 'Bahan Bangunan',
    satuan: 'sak',
    stokMin: 20,
    harga: 62000,
    rak: 'H-1',
    supplier: 'Toko Bangunan Makmur',
    batches: [{ no: 'SM-2601', qty: 15, exp: 100 }],
  },
  {
    nama: 'Cat Tembok 5kg',
    kategori: 'Bahan Bangunan',
    satuan: 'kaleng',
    stokMin: 6,
    harga: 135000,
    rak: 'H-2',
    supplier: 'Toko Bangunan Makmur',
    batches: [{ no: 'CT-2601', qty: 9, exp: 500 }],
  },
  {
    nama: 'Oli Mesin 1 Liter',
    kategori: 'Suku Cadang & Otomotif',
    satuan: 'botol',
    stokMin: 10,
    harga: 58000,
    rak: 'I-1',
    supplier: 'PT Elektronik Jaya Abadi',
    batches: [{ no: 'OL-2601', qty: 24 }],
  },
  {
    nama: 'Kampas Rem Depan',
    kategori: 'Suku Cadang & Otomotif',
    satuan: 'set',
    stokMin: 6,
    harga: 95000,
    rak: 'I-2',
    supplier: 'PT Elektronik Jaya Abadi',
    batches: [{ no: 'KM-2601', qty: 3 }],
  },
  {
    nama: 'Kardus Packing Medium',
    kategori: 'Kemasan & Packaging',
    satuan: 'lembar',
    stokMin: 30,
    harga: 4500,
    rak: 'J-1',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'KD-2601', qty: 220 }],
    keluar: 20,
  },
  {
    nama: 'Bubble Wrap 1 Meter',
    kategori: 'Kemasan & Packaging',
    satuan: 'roll',
    stokMin: 10,
    harga: 35000,
    rak: 'J-2',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'BW-2601', qty: 8 }],
  },
  {
    nama: 'Lakban Bening 2 Inch',
    kategori: 'Kemasan & Packaging',
    satuan: 'roll',
    stokMin: 20,
    harga: 8000,
    rak: 'J-3',
    supplier: 'PT Sumber Pangan Sejahtera',
    batches: [{ no: 'LB-2601', qty: 65 }],
  },
];

/** Prefix SKU dari nama kategori, sama seperti di aplikasi. */
function prefixKategori(nama) {
  const bersih = String(nama)
    .normalize('NFD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toUpperCase();
  const gabung = bersih.split(/\s+/).filter(Boolean).join('');
  return (gabung.slice(0, 3) || 'BRG').padEnd(3, 'X');
}

async function bersihkan() {
  await prisma.auditLog.deleteMany();
  await prisma.itemTransaksi.deleteMany();
  await prisma.transaksiStok.deleteMany();
  await prisma.batchStok.deleteMany();
  await prisma.barang.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.kategori.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('🧹 Menghapus data lama…');
  await bersihkan();

  // 1. User
  console.log('👥 Membuat akun demo…');
  const user = {};
  for (const u of USERS) {
    user[u.role] = await prisma.user.create({
      data: {
        nama: u.nama,
        username: u.username,
        email: u.email,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 10),
      },
    });
  }

  // 2. Kategori
  console.log('🏷️  Membuat 10 kategori…');
  const kategori = {};
  for (const k of KATEGORI) {
    kategori[k.nama] = await prisma.kategori.create({ data: k });
  }

  // 3. Supplier
  console.log('🚚 Membuat supplier…');
  const supplier = {};
  for (const s of SUPPLIER) {
    supplier[s.nama] = await prisma.supplier.create({ data: s });
  }

  // 4. Barang + batch
  console.log('📦 Membuat barang dan batch stok…');
  const urutanSku = {};
  const dataBarang = {};

  for (const b of BARANG) {
    const prefix = prefixKategori(b.kategori);
    urutanSku[prefix] = (urutanSku[prefix] || 0) + 1;
    const sku = `${prefix}-${String(urutanSku[prefix]).padStart(4, '0')}`;

    const barang = await prisma.barang.create({
      data: {
        sku,
        nama: b.nama,
        kategoriId: kategori[b.kategori].id,
        satuan: b.satuan,
        stokMin: b.stokMin,
        hargaBeli: b.harga,
        lokasiRak: b.rak,
      },
    });

    const batches = [];
    for (const batch of b.batches) {
      batches.push(
        await prisma.batchStok.create({
          data: {
            barangId: barang.id,
            batchNo: batch.no,
            qty: batch.qty,
            expiredAt: batch.exp === undefined ? null : hariLalu(batch.exp),
            createdAt: hariLalu(-25),
          },
        }),
      );
    }

    dataBarang[b.nama] = { barang, batches, definisi: b };
  }

  // 5. Transaksi barang masuk (dikelompokkan per kategori)
  console.log('📥 Mencatat barang masuk…');
  const perKategori = new Map();
  for (const b of BARANG) {
    if (!perKategori.has(b.kategori)) perKategori.set(b.kategori, []);
    perKategori.get(b.kategori).push(b);
  }

  let hariMasuk = -24;
  const transaksiMasuk = [];
  for (const [namaKategori, daftar] of perKategori) {
    const dibuat = await prisma.transaksiStok.create({
      data: {
        tipe: 'MASUK',
        status: 'DISETUJUI',
        tanggal: hariLalu(hariMasuk),
        noDokumen: `IN-${String(hariMasuk).replace('-', '')}-001`,
        supplierId: supplier[daftar[0].supplier]?.id || null,
        tujuan: `Penerimaan ${namaKategori}`,
        dibuatOlehId: user[ROLE.INVENTORI].id,
        disetujuiOlehId: user[ROLE.KEPALA].id,
        approvedAt: hariLalu(hariMasuk, 10),
        createdAt: hariLalu(hariMasuk),
      },
    });

    for (const b of daftar) {
      const { barang, batches } = dataBarang[b.nama];
      for (const batch of batches) {
        await prisma.itemTransaksi.create({
          data: {
            transaksiId: dibuat.id,
            barangId: barang.id,
            batchId: batch.id,
            qty: batch.qty,
            harga: b.harga,
          },
        });
      }
    }

    transaksiMasuk.push(dibuat);
    hariMasuk += 2;
  }

  // 6. Barang keluar yang sudah disetujui (stok berkurang)
  console.log('📤 Mencatat barang keluar yang disetujui…');
  const keluarDisetujui = [
    { barang: 'Beras Premium 5kg', qty: 10, tujuan: 'Dapur mess karyawan', hari: -6 },
    { barang: 'Air Mineral 600ml', qty: 5, tujuan: 'Rapat bulanan', hari: -5 },
    { barang: 'Kardus Packing Medium', qty: 20, tujuan: 'Pengiriman pesanan online', hari: -4 },
    { barang: 'Minyak Goreng 2L', qty: 3, tujuan: 'Konsumsi kantin', hari: -3 },
  ];

  let nomorKeluar = 1;
  for (const k of keluarDisetujui) {
    const { barang, batches } = dataBarang[k.barang];

    // Kurangi batch paling cepat expired (FEFO)
    let sisa = k.qty;
    for (const batch of batches) {
      if (sisa <= 0) break;
      const ambil = Math.min(sisa, batch.qty);
      await prisma.batchStok.update({
        where: { id: batch.id },
        data: { qty: { decrement: ambil } },
      });
      batch.qty -= ambil;
      sisa -= ambil;
    }

    await prisma.transaksiStok.create({
      data: {
        tipe: 'KELUAR',
        status: 'DISETUJUI',
        tanggal: hariLalu(k.hari, 13),
        noDokumen: `OUT-2601-${String(nomorKeluar).padStart(3, '0')}`,
        tujuan: k.tujuan,
        dibuatOlehId: user[ROLE.STAF].id,
        disetujuiOlehId: user[ROLE.KEPALA].id,
        approvedAt: hariLalu(k.hari, 14),
        createdAt: hariLalu(k.hari, 13),
        items: {
          create: [{ barangId: barang.id, qty: k.qty, harga: null }],
        },
      },
    });
    nomorKeluar += 1;
  }

  // 7. Opname yang sudah disetujui: Tinta printer selisih -2 (stok jadi habis)
  const tinta = dataBarang['Tinta Printer Hitam'];
  const opnameDisetujui = await prisma.transaksiStok.create({
    data: {
      tipe: 'PENYESUAIAN',
      status: 'DISETUJUI',
      tanggal: hariLalu(-2, 16),
      noDokumen: 'OP-2601-001',
      alasan: 'Stock opname bulanan: 2 botol rusak/pecah',
      dibuatOlehId: user[ROLE.INVENTORI].id,
      disetujuiOlehId: user[ROLE.MANAJER].id,
      approvedAt: hariLalu(-2, 17),
      createdAt: hariLalu(-2, 16),
    },
  });
  await prisma.itemTransaksi.create({
    data: {
      transaksiId: opnameDisetujui.id,
      barangId: tinta.barang.id,
      qty: -2,
      stokSistem: 2,
      stokFisik: 0,
    },
  });
  for (const batch of tinta.batches) {
    await prisma.batchStok.update({ where: { id: batch.id }, data: { qty: 0 } });
    batch.qty = 0;
  }

  // 8. Pengajuan yang masih menunggu persetujuan
  console.log('⏳ Membuat pengajuan menunggu persetujuan…');
  await prisma.transaksiStok.create({
    data: {
      tipe: 'KELUAR',
      status: 'MENUNGGU',
      tanggal: hariLalu(0, 8),
      noDokumen: 'OUT-2601-005',
      tujuan: 'Persiapan produksi shift pagi',
      dibuatOlehId: user[ROLE.STAF].id,
      createdAt: hariLalu(0, 8),
      items: {
        create: [
          { barangId: dataBarang['Beras Premium 5kg'].barang.id, qty: 8 },
          { barangId: dataBarang['Gula Pasir 1kg'].barang.id, qty: 5 },
        ],
      },
    },
  });

  await prisma.transaksiStok.create({
    data: {
      tipe: 'PENYESUAIAN',
      status: 'MENUNGGU',
      tanggal: hariLalu(0, 10),
      noDokumen: 'OP-2601-002',
      alasan: 'Selisih hitung fisik rak B-2',
      dibuatOlehId: user[ROLE.INVENTORI].id,
      createdAt: hariLalu(0, 10),
      items: {
        create: [
          {
            barangId: dataBarang['Teh Celup 25 Kantung'].barang.id,
            qty: 1,
            stokSistem: 8,
            stokFisik: 9,
          },
        ],
      },
    },
  });

  // 9. Satu pengajuan ditolak sebagai contoh
  await prisma.transaksiStok.create({
    data: {
      tipe: 'KELUAR',
      status: 'DITOLAK',
      tanggal: hariLalu(-1, 11),
      noDokumen: 'OUT-2601-004',
      tujuan: 'Permintaan tanpa surat jalan',
      dibuatOlehId: user[ROLE.STAF].id,
      disetujuiOlehId: user[ROLE.KEPALA].id,
      approvedAt: hariLalu(-1, 12),
      catatanTolak: 'Lengkapi surat permintaan dari kepala bagian dulu ya.',
      createdAt: hariLalu(-1, 11),
      items: {
        create: [{ barangId: dataBarang['Lakban Bening 2 Inch'].barang.id, qty: 5 }],
      },
    },
  });

  // 10. Audit log contoh
  console.log('🔐 Menulis audit log awal…');
  const logAwal = [
    { user: ROLE.ADMIN, aksi: 'TAMBAH_USER', entitas: 'User', detail: 'Membuat 6 akun demo karyawan' },
    { user: ROLE.INVENTORI, aksi: 'BARANG_MASUK', entitas: 'TransaksiStok', detail: 'Penerimaan barang dari 6 supplier' },
    { user: ROLE.KEPALA, aksi: 'APPROVE_TRANSAKSI', entitas: 'TransaksiStok', detail: 'Menyetujui pengajuan barang keluar' },
    { user: ROLE.MANAJER, aksi: 'APPROVE_TRANSAKSI', entitas: 'TransaksiStok', detail: 'Menyetujui penyesuaian stock opname' },
    { user: ROLE.STAF, aksi: 'AJUKAN_KELUAR', entitas: 'TransaksiStok', detail: 'Pengajuan keluar OUT-2601-005' },
    { user: ROLE.AUDITOR, aksi: 'LOGIN', entitas: 'User', detail: 'Auditor login untuk pemeriksaan' },
  ];
  for (const [i, log] of logAwal.entries()) {
    await prisma.auditLog.create({
      data: {
        userId: user[log.user].id,
        aksi: log.aksi,
        entitas: log.entitas,
        detail: log.detail,
        waktu: hariLalu(-1, 9 + i),
      },
    });
  }

  const jumlah = {
    user: await prisma.user.count(),
    kategori: await prisma.kategori.count(),
    supplier: await prisma.supplier.count(),
    barang: await prisma.barang.count(),
    batch: await prisma.batchStok.count(),
    transaksi: await prisma.transaksiStok.count(),
  };

  console.log('\n✅ Seed selesai:');
  console.log(
    `   ${jumlah.user} user · ${jumlah.kategori} kategori · ${jumlah.supplier} supplier\n` +
      `   ${jumlah.barang} barang · ${jumlah.batch} batch · ${jumlah.transaksi} transaksi`,
  );
  console.log('\nAkun demo (username / password):');
  for (const u of USERS) console.log(`   ${u.username} / ${u.password}  (${u.role})`);
}

main()
  .catch((err) => {
    console.error('❌ Seed gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
