import { badRequest } from '../lib/errors.js';

/** Kumpulan validasi input yang dipakai controller. */

export function teksWajib(nilai, namaField, max = 200) {
  const teks = String(nilai ?? '').trim();
  if (!teks) throw badRequest(`${namaField} wajib diisi.`);
  if (teks.length > max) throw badRequest(`${namaField} maksimal ${max} karakter.`);
  return teks;
}

export function teksOpsional(nilai, max = 300) {
  return String(nilai ?? '').trim().slice(0, max);
}

export function angka(nilai, namaField, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = typeof nilai === 'number' ? nilai : Number(String(nilai ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) throw badRequest(`${namaField} harus berupa angka.`);
  if (n < min) throw badRequest(`${namaField} minimal ${min}.`);
  if (n > max) throw badRequest(`${namaField} maksimal ${max}.`);
  return n;
}

export function bilanganBulat(nilai, namaField, opsi = {}) {
  return Math.round(angka(nilai, namaField, opsi));
}

export function tanggalWajib(nilai, namaField = 'Tanggal') {
  const t = new Date(nilai);
  if (Number.isNaN(t.getTime())) throw badRequest(`${namaField} tidak valid.`);
  return t;
}

export function tanggalOpsional(nilai, namaField = 'Tanggal') {
  if (nilai === null || nilai === undefined || nilai === '') return null;
  return tanggalWajib(nilai, namaField);
}

export function salahSatuDari(nilai, daftar, namaField) {
  if (!daftar.includes(nilai)) {
    throw badRequest(`${namaField} harus salah satu dari: ${daftar.join(', ')}.`);
  }
  return nilai;
}

/** Warna hex #RRGGBB untuk chip kategori. */
export function validasiWarna(nilai, bawaan = '#0EA5A4') {
  if (nilai === undefined || nilai === null || nilai === '') return bawaan;
  const warna = String(nilai).trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(warna)) {
    throw badRequest('Warna harus berformat hex, contoh #0EA5A4.');
  }
  return warna.toUpperCase();
}

/** Id opsional (string kosong dianggap null). */
export function idOpsional(nilai) {
  const teks = String(nilai ?? '').trim();
  return teks || null;
}

/** Ambil page & limit dari query dengan batas aman. */
export function pageLimit(query, bawaanLimit = 10) {
  const page = Math.max(1, Math.trunc(Number(query.page) || 1));
  const limit = Math.min(200, Math.max(1, Math.trunc(Number(query.limit) || bawaanLimit)));
  return { page, limit, skip: (page - 1) * limit };
}
