import { STATUS_STOK, STATUS_TRANSAKSI, gayaKategori } from '../lib/format.js';

/** Label status stok: hijau aman, kuning menipis, merah habis. */
export function BadgeStok({ status, className = '' }) {
  const meta = STATUS_STOK[status] || STATUS_STOK.AMAN;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.kelas} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.titik}`} />
      {meta.label}
    </span>
  );
}

/** Label status transaksi (menunggu / disetujui / ditolak). */
export function BadgeTransaksi({ status }) {
  const meta = STATUS_TRANSAKSI[status] || STATUS_TRANSAKSI.MENUNGGU;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.kelas}`}>
      {meta.label}
    </span>
  );
}

/** Chip kategori berwarna sesuai warna kategorinya. */
export function ChipKategori({ kategori, className = '' }) {
  if (!kategori) return <span className="text-inkl">-</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
      style={gayaKategori(kategori.warna)}
    >
      <span aria-hidden>{kategori.ikon}</span>
      {kategori.nama}
    </span>
  );
}

export function EmptyState({ ikon = '📭', judul, pesan, aksi }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden>
        {ikon}
      </span>
      <h3 className="text-base font-semibold text-ink">{judul}</h3>
      {pesan && <p className="max-w-sm text-sm text-inkl">{pesan}</p>}
      {aksi && <div className="mt-2">{aksi}</div>}
    </div>
  );
}

export function Memuat({ teks = 'Memuat data…' }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-14 text-sm text-inkl">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-laut border-t-transparent" />
      {teks}
    </div>
  );
}

/** Baris kerangka saat data dimuat. */
export function KerangkaBaris({ jumlah = 5 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onPindah }) {
  if (!totalPages || totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-4 py-3 text-xs text-inkl">
        <span>Total {total ?? 0} data</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
      <span className="text-xs text-inkl">
        Halaman {page} dari {totalPages} · {total} data
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-sekunder btn-kecil"
          onClick={() => onPindah(page - 1)}
          disabled={page <= 1}
        >
          ← Sebelumnya
        </button>
        <button
          type="button"
          className="btn-sekunder btn-kecil"
          onClick={() => onPindah(page + 1)}
          disabled={page >= totalPages}
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );
}

/** Judul halaman + aksi di kanan. */
export function JudulHalaman({ judul, keterangan, aksi }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-ink sm:text-2xl">{judul}</h1>
        {keterangan && <p className="mt-1 text-sm text-inkl">{keterangan}</p>}
      </div>
      {aksi}
    </div>
  );
}
