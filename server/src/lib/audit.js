/**
 * Pencatat audit log. Dipanggil dari controller setiap ada aksi penting.
 * Menerima `tx` (prisma transaction) supaya ikut rollback kalau aksinya gagal.
 */
export async function catatAudit(db, { userId, aksi, entitas, entitasId = null, detail = '' }) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        aksi,
        entitas,
        entitasId,
        detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
      },
    });
  } catch (err) {
    // Audit log tidak boleh menggagalkan aksi utama
    console.error('[audit] gagal mencatat:', err.message);
  }
}
