/**
 * Daftar role, status, tipe transaksi, dan matriks hak akses.
 * Semua pengecekan role di backend mengacu ke IZIN di bawah.
 */

export const ROLE = {
  ADMIN_SISTEM: 'ADMIN_SISTEM',
  MANAJER: 'MANAJER',
  KEPALA: 'KEPALA',
  ADMIN_INVENTORI: 'ADMIN_INVENTORI',
  STAF: 'STAF',
  AUDITOR: 'AUDITOR',
};

export const SEMUA_ROLE = Object.values(ROLE);

export const LABEL_ROLE = {
  ADMIN_SISTEM: 'Admin Sistem',
  MANAJER: 'Manajer Gudang',
  KEPALA: 'Kepala Gudang',
  ADMIN_INVENTORI: 'Admin Inventori',
  STAF: 'Staf Gudang',
  AUDITOR: 'Auditor / Viewer',
};

export const TIPE_TRANSAKSI = {
  MASUK: 'MASUK',
  KELUAR: 'KELUAR',
  PENYESUAIAN: 'PENYESUAIAN',
};

export const STATUS = {
  MENUNGGU: 'MENUNGGU',
  DISETUJUI: 'DISETUJUI',
  DITOLAK: 'DITOLAK',
};

const { ADMIN_SISTEM, MANAJER, KEPALA, ADMIN_INVENTORI, STAF, AUDITOR } = ROLE;

/**
 * Matriks hak akses (sesuai PRD bagian 3).
 * Nama kunci dipakai sebagai argumen requireIzin('<kunci>').
 */
export const IZIN = {
  kelolaUser: [ADMIN_SISTEM],

  lihatDashboard: [ADMIN_SISTEM, MANAJER, KEPALA, ADMIN_INVENTORI, STAF, AUDITOR],
  lihatMaster: [ADMIN_SISTEM, MANAJER, KEPALA, ADMIN_INVENTORI, STAF, AUDITOR],

  kelolaBarang: [ADMIN_SISTEM, MANAJER, ADMIN_INVENTORI],
  kelolaKategori: [ADMIN_SISTEM, MANAJER, ADMIN_INVENTORI],
  kelolaSupplier: [ADMIN_SISTEM, MANAJER, ADMIN_INVENTORI],

  catatMasuk: [ADMIN_SISTEM, MANAJER, KEPALA, ADMIN_INVENTORI, STAF],
  ajukanKeluar: [ADMIN_SISTEM, MANAJER, KEPALA, ADMIN_INVENTORI, STAF],
  approveKeluar: [ADMIN_SISTEM, MANAJER, KEPALA],

  opnameInput: [ADMIN_SISTEM, ADMIN_INVENTORI],
  opnameApprove: [ADMIN_SISTEM, MANAJER, KEPALA],

  lihatLaporan: [ADMIN_SISTEM, MANAJER, KEPALA, ADMIN_INVENTORI, AUDITOR],
  lihatAudit: [ADMIN_SISTEM, MANAJER, AUDITOR],
};

/** Apakah role tertentu punya izin tertentu. */
export function boleh(role, namaIzin) {
  return (IZIN[namaIzin] || []).includes(role);
}

/** Daftar izin milik satu role — dikirim ke frontend untuk menyusun menu. */
export function izinRole(role) {
  return Object.entries(IZIN)
    .filter(([, daftarRole]) => daftarRole.includes(role))
    .map(([nama]) => nama);
}
