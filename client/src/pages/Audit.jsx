import { useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { waktu } from '../lib/format.js';
import { EmptyState, JudulHalaman, KerangkaBaris, Pagination } from '../components/Ui.jsx';

const LABEL_AKSI = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_GAGAL: 'Login gagal',
  UBAH_PASSWORD: 'Ubah password',
  RESET_PASSWORD: 'Reset password',
  TAMBAH_USER: 'Tambah user',
  UBAH_USER: 'Ubah user',
  TAMBAH_BARANG: 'Tambah barang',
  UBAH_BARANG: 'Ubah barang',
  HAPUS_BARANG: 'Hapus barang',
  TAMBAH_KATEGORI: 'Tambah kategori',
  UBAH_KATEGORI: 'Ubah kategori',
  HAPUS_KATEGORI: 'Hapus kategori',
  TAMBAH_SUPPLIER: 'Tambah supplier',
  UBAH_SUPPLIER: 'Ubah supplier',
  HAPUS_SUPPLIER: 'Hapus supplier',
  BARANG_MASUK: 'Barang masuk',
  AJUKAN_KELUAR: 'Ajukan keluar',
  AJUKAN_OPNAME: 'Ajukan opname',
  APPROVE_TRANSAKSI: 'Setujui transaksi',
  TOLAK_TRANSAKSI: 'Tolak transaksi',
};

/** Audit log: jejak aksi penting, hanya bisa dibaca. */
export default function Audit() {
  const toast = useToast();

  const [filter, setFilter] = useState({ aksi: '', q: '', dari: '', ke: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1, page: 1, pilihanAksi: [] });
  const [memuat, setMemuat] = useState(true);

  async function muat() {
    setMemuat(true);
    try {
      const hasil = await api.get(`/audit${qs({ ...filter, page, limit: 25 })}`);
      setData(hasil);
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(muat, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  function ubah(kunci, nilai) {
    setPage(1);
    setFilter((lama) => ({ ...lama, [kunci]: nilai }));
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Audit Log"
        keterangan="Catatan aksi penting: login, perubahan data, dan persetujuan. Tidak bisa diubah."
      />

      <div className="kartu grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Cari keterangan…"
          value={filter.q}
          onChange={(e) => ubah('q', e.target.value)}
        />
        <select className="input" value={filter.aksi} onChange={(e) => ubah('aksi', e.target.value)}>
          <option value="">Semua aksi</option>
          {data.pilihanAksi?.map((a) => (
            <option key={a} value={a}>
              {LABEL_AKSI[a] || a}
            </option>
          ))}
        </select>
        <input type="date" className="input" value={filter.dari} onChange={(e) => ubah('dari', e.target.value)} />
        <input type="date" className="input" value={filter.ke} onChange={(e) => ubah('ke', e.target.value)} />
      </div>

      <div className="kartu overflow-hidden">
        {memuat ? (
          <KerangkaBaris jumlah={8} />
        ) : data.items.length === 0 ? (
          <EmptyState ikon="🔐" judul="Belum ada catatan" pesan="Audit log terisi otomatis saat ada aksi." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Pengguna</th>
                    <th>Aksi</th>
                    <th>Entitas</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-xs">{waktu(log.waktu)}</td>
                      <td className="whitespace-nowrap">
                        <p className="text-sm font-medium">{log.user?.nama || 'Sistem'}</p>
                        <p className="text-xs text-inkl">{log.user?.role || '-'}</p>
                      </td>
                      <td>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                          {LABEL_AKSI[log.aksi] || log.aksi}
                        </span>
                      </td>
                      <td className="text-xs">{log.entitas}</td>
                      <td className="max-w-md text-sm text-slate-600">{log.detail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {data.items.map((log) => (
                <li key={log.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {LABEL_AKSI[log.aksi] || log.aksi}
                    </span>
                    <span className="text-xs text-inkl">{waktu(log.waktu)}</span>
                  </div>
                  <p className="mt-1.5 text-sm">{log.detail || '-'}</p>
                  <p className="text-xs text-inkl">
                    {log.user?.nama || 'Sistem'} · {log.entitas}
                  </p>
                </li>
              ))}
            </ul>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPindah={(p) => setPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
}
