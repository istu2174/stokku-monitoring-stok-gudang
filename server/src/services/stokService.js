/**
 * Semua logika yang menyentuh angka stok ada di sini.
 * Fungsi-fungsi ini WAJIB dipanggil di dalam prisma.$transaction supaya
 * stok tidak pernah setengah berubah kalau ada error di tengah jalan.
 */

/** Urutkan batch: yang paling cepat kedaluwarsa di depan (FEFO), tanpa expired di belakang. */
export function urutkanFEFO(batches) {
  return [...batches].sort((a, b) => {
    const ax = a.expiredAt ? new Date(a.expiredAt).getTime() : Infinity;
    const bx = b.expiredAt ? new Date(b.expiredAt).getTime() : Infinity;
    if (ax !== bx) return ax - bx;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/** Total stok satu barang (jumlah semua batch). */
export async function totalStok(db, barangId) {
  const agg = await db.batchStok.aggregate({
    where: { barangId },
    _sum: { qty: true },
  });
  return agg._sum.qty || 0;
}

/** Tambah stok ke batch tertentu; batch dibuat kalau belum ada. */
export async function tambahKeBatch(db, { barangId, batchNo, expiredAt = null, qty }) {
  const no = String(batchNo ?? '-').trim() || '-';
  return db.batchStok.upsert({
    where: { barangId_batchNo: { barangId, batchNo: no } },
    update: {
      qty: { increment: qty },
      ...(expiredAt ? { expiredAt } : {}),
    },
    create: { barangId, batchNo: no, qty, expiredAt },
  });
}

/**
 * Kurangi stok dengan aturan FEFO (expired terdekat keluar dulu).
 * Melempar error kalau stok tidak cukup — tidak mungkin jadi minus.
 */
export async function kurangiFEFO(db, barangId, qty, namaBarang = 'Barang') {
  const batches = await db.batchStok.findMany({ where: { barangId } });
  const tersedia = batches.reduce((total, b) => total + b.qty, 0);

  if (tersedia + 1e-9 < qty) {
    const err = new Error(
      `Stok ${namaBarang} tidak cukup. Tersedia ${tersedia}, diminta ${qty}.`,
    );
    err.status = 400;
    throw err;
  }

  let sisa = qty;
  const dipakai = [];
  for (const batch of urutkanFEFO(batches.filter((b) => b.qty > 0))) {
    if (sisa <= 1e-9) break;
    const ambil = Math.min(sisa, batch.qty);
    await db.batchStok.update({
      where: { id: batch.id },
      data: { qty: { decrement: ambil } },
    });
    dipakai.push({ batchId: batch.id, batchNo: batch.batchNo, qty: ambil });
    sisa -= ambil;
  }

  return dipakai;
}
