import { useCallback, useEffect, useState } from 'react';
import { api, qs, unduhLaporan } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { angka } from '../lib/format.js';
import { EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';

const TAB = [
  { kunci: 'stok', label: 'Stok Barang', endpoint: '/laporan/stok', namaFile: 'laporan-stok' },
  { kunci: 'menipis', label: 'Menipis & Habis', endpoint: '/laporan/menipis', namaFile: 'laporan-stok-menipis' },
  { kunci: 'nilai', label: 'Nilai Persediaan', endpoint: '/laporan/nilai', namaFile: 'laporan-nilai-persediaan' },
  { kunci: 'mutasi', label: 'Mutasi Stok', endpoint: '/laporan/mutasi', namaFile: 'laporan-mutasi-stok' },
  { kunci: 'expired', label: 'Expired', endpoint: '/laporan/expired', namaFile: 'laporan-expired' },
];

/** Laporan & ekspor: pratinjau di layar, unduh xlsx atau csv. */
export default function Laporan() {
  const toast = useToast();

  const [tab, setTab] = useState('stok');
  const [kategori, setKategori] = useState([]);
  const [filter, setFilter] = useState({ kategoriId: '', status: '', dari: '', ke: '', tipe: '' });
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [sedangUnduh, setSedangUnduh] = useState(false);

  const aktif = TAB.find((t) => t.kunci === tab);

  useEffect(() => {
    api
      .get('/kategori')
      .then((d) => setKategori(d.items))
      .catch(() => setKategori([]));
  }, []);

  const susunQuery = useCallback(
    (format) => {
      if (tab === 'mutasi') {
        return qs({ format, dari: filter.dari, ke: filter.ke, tipe: filter.tipe });
      }
      if (tab === 'stok') {
        return qs({ format, kategoriId: filter.kategoriId, status: filter.status });
      }
      return qs({ format });
    },
    [tab, filter],
  );

  async function muat() {
    setMemuat(true);
    try {
      const hasil = await api.get(`${aktif.endpoint}${susunQuery()}`);
      setData(hasil);
    } catch (err) {
      toast.gagal(err.message);
      setData(null);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filter]);

  async function unduh(format) {
    setSedangUnduh(true);
    try {
      await unduhLaporan(
        `${aktif.endpoint}${susunQuery(format)}`,
        `${aktif.namaFile}.${format}`,
      );
      toast.sukses(`Laporan ${format.toUpperCase()} berhasil diunduh.`);
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangUnduh(false);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Laporan"
        keterangan="Pratinjau data di layar, lalu unduh sebagai Excel atau CSV."
        aksi={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-sekunder"
              onClick={() => unduh('csv')}
              disabled={sedangUnduh}
            >
              Unduh CSV
            </button>
            <button
              type="button"
              className="btn-utama"
              onClick={() => unduh('xlsx')}
              disabled={sedangUnduh}
            >
              {sedangUnduh ? 'Menyiapkan…' : 'Unduh Excel'}
            </button>
          </div>
        }
      />

      {/* Tab laporan */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAB.map((t) => (
          <button
            key={t.kunci}
            type="button"
            onClick={() => setTab(t.kunci)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === t.kunci
                ? 'bg-laut text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter sesuai tab */}
      {(tab === 'stok' || tab === 'mutasi') && (
        <div className="kartu grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {tab === 'stok' && (
            <>
              <select
                className="input"
                value={filter.kategoriId}
                onChange={(e) => setFilter({ ...filter, kategoriId: e.target.value })}
              >
                <option value="">Semua kategori</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ikon} {k.nama}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">Semua status</option>
                <option value="AMAN">Aman</option>
                <option value="MENIPIS">Menipis</option>
                <option value="HABIS">Habis</option>
              </select>
            </>
          )}
          {tab === 'mutasi' && (
            <>
              <input
                type="date"
                className="input"
                value={filter.dari}
                onChange={(e) => setFilter({ ...filter, dari: e.target.value })}
              />
              <input
                type="date"
                className="input"
                value={filter.ke}
                onChange={(e) => setFilter({ ...filter, ke: e.target.value })}
              />
              <select
                className="input"
                value={filter.tipe}
                onChange={(e) => setFilter({ ...filter, tipe: e.target.value })}
              >
                <option value="">Masuk & keluar</option>
                <option value="MASUK">Hanya masuk</option>
                <option value="KELUAR">Hanya keluar</option>
                <option value="PENYESUAIAN">Hanya penyesuaian</option>
              </select>
            </>
          )}
          <button
            type="button"
            className="btn-sekunder"
            onClick={() => setFilter({ kategoriId: '', status: '', dari: '', ke: '', tipe: '' })}
          >
            Reset filter
          </button>
        </div>
      )}

      <div className="kartu overflow-hidden">
        {memuat ? (
          <KerangkaBaris jumlah={6} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState ikon="🗂️" judul="Tidak ada data" pesan="Belum ada data untuk filter ini." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="tabel">
                <thead>
                  <tr>
                    {data.kolom.map((kolom) => (
                      <th key={kolom.key}>{kolom.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((baris, index) => (
                    <tr key={index}>
                      {data.kolom.map((kolom) => {
                        const nilai = baris[kolom.key];
                        return (
                          <td key={kolom.key} className={typeof nilai === 'number' ? 'text-right' : ''}>
                            {typeof nilai === 'number' ? angka(nilai) : nilai || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-xs text-inkl">
              <span>{data.total} baris</span>
              <span>Klik tombol unduh untuk menyimpan versi Excel/CSV.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
