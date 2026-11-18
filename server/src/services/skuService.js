import { prisma } from '../lib/prisma.js';
import { conflict } from '../lib/errors.js';

/**
 * Prefix SKU dari nama kategori: "Makanan & Bahan Pokok" → "MAK".
 * Huruf non-alfanumerik dibuang dulu.
 */
export function prefixKategori(namaKategori) {
  const bersih = String(namaKategori)
    .normalize('NFD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toUpperCase();
  const gabung = bersih.split(/\s+/).filter(Boolean).join('');
  return (gabung.slice(0, 3) || 'BRG').padEnd(3, 'X');
}

/**
 * SKU otomatis per kategori, contoh MAK-0001.
 * Dipanggil di dalam transaksi DB; kalau bentrok, nomor dinaikkan.
 */
export async function buatSkuOtomatis(db, kategoriId) {
  const kategori = await db.kategori.findUnique({ where: { id: kategoriId } });
  if (!kategori) throw conflict('Kategori tidak ditemukan.');

  const prefix = prefixKategori(kategori.nama);
  const terakhir = await db.barang.findFirst({
    where: { sku: { startsWith: `${prefix}-` } },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });

  let urutan = 1;
  if (terakhir?.sku) {
    const angka = Number(terakhir.sku.split('-')[1]);
    if (Number.isFinite(angka)) urutan = angka + 1;
  }

  // Jaga-jaga kalau nomor sudah terpakai (misal data diinput manual)
  for (let percobaan = 0; percobaan < 50; percobaan += 1) {
    const sku = `${prefix}-${String(urutan + percobaan).padStart(4, '0')}`;
    const ada = await db.barang.findUnique({ where: { sku } });
    if (!ada) return sku;
  }
  throw conflict('Gagal membuat SKU otomatis, coba lagi.');
}
