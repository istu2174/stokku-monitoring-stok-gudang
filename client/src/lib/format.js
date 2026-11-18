/** Helper format angka, tanggal, dan label status. */

export function rupiah(nilai) {
  return `Rp ${Number(nilai || 0).toLocaleString('id-ID')}`;
}

/** Angka ringkas untuk nilai besar: 1.250.000 → Rp 1,3 jt */
export function rupiahRingkas(nilai) {
  const n = Number(nilai || 0);
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (n >= 10_000) return `Rp ${Math.round(n / 1000)} rb`;
  return rupiah(n);
}

/** 2.5 → "2,5" (buang nol di belakang koma) */
export function angka(nilai) {
  const n = Number(nilai || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',').replace(/0$/, '');
}

const NAMA_BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export function tanggal(nilai) {
  if (!nilai) return '-';
  const d = new Date(nilai);
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function tanggalPanjang(nilai) {
  if (!nilai) return '-';
  const d = new Date(nilai);
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function waktu(nilai) {
  if (!nilai) return '-';
  const d = new Date(nilai);
  const jam = String(d.getHours()).padStart(2, '0');
  const menit = String(d.getMinutes()).padStart(2, '0');
  return `${tanggal(nilai)} ${jam}:${menit}`;
}

/** Nilai untuk <input type="date"> */
export function inputTanggal(nilai = new Date()) {
  const d = new Date(nilai);
  const bulan = String(d.getMonth() + 1).padStart(2, '0');
  const hari = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

/** Warna & label status stok sesuai PRD: aman / menipis / habis. */
export const STATUS_STOK = {
  AMAN: { label: 'Aman', kelas: 'bg-amans text-aman ring-aman/20', titik: 'bg-aman' },
  MENIPIS: { label: 'Menipis', kelas: 'bg-menipiss text-menipis ring-menipis/20', titik: 'bg-menipis' },
  HABIS: { label: 'Habis', kelas: 'bg-habiss text-habis ring-habis/20', titik: 'bg-habis' },
};

export const TIPE_TRANSAKSI = {
  MASUK: { label: 'Barang Masuk', singkat: 'Masuk', ikon: '📥', kelas: 'bg-amans text-aman' },
  KELUAR: { label: 'Barang Keluar', singkat: 'Keluar', ikon: '📤', kelas: 'bg-birus text-biru' },
  PENYESUAIAN: { label: 'Stock Opname', singkat: 'Opname', ikon: '⚖️', kelas: 'bg-menipiss text-menipis' },
};

export const STATUS_TRANSAKSI = {
  MENUNGGU: { label: 'Menunggu', kelas: 'bg-menipiss text-menipis ring-menipis/20' },
  DISETUJUI: { label: 'Disetujui', kelas: 'bg-amans text-aman ring-aman/20' },
  DITOLAK: { label: 'Ditolak', kelas: 'bg-habiss text-habis ring-habis/20' },
};

/** Warna chip kategori: latar transparan dari warna hex kategori. */
export function gayaKategori(warna) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(warna || '') ? warna : '#0F766E';
  return {
    backgroundColor: `${hex}1A`,
    color: hex,
    borderColor: `${hex}33`,
  };
}
