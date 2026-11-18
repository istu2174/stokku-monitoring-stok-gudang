import { useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { angka, tanggal, TIPE_TRANSAKSI, waktu } from '../lib/format.js';
import {
  BadgeTransaksi,
  EmptyState,
  JudulHalaman,
  KerangkaBaris,
  Pagination,
} from '../components/Ui.jsx';
import Modal from '../components/Modal.jsx';

/** Riwayat semua transaksi, bisa difilter per tipe/status/tanggal. */
export default function Riwayat() {
  const toast = useToast();

  const [filter, setFilter] = useState({ tipe: '', status: '', dari: '', ke: '', q: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1, page: 1 });
  const [memuat, setMemuat] = useState(true);
  const [detail, setDetail] = useState(null);

  async function muat() {
    setMemuat(true);
    try {
      const hasil = await api.get(
        `/transaksi${qs({ ...filter, page, limit: 10 })}`,
      );
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

  async function bukaDetail(id) {
    try {
      setDetail(await api.get(`/transaksi/${id}`));
    } catch (err) {
      toast.gagal(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman judul="Riwayat Transaksi" keterangan="Semua pencatatan barang masuk, keluar, dan opname." />

      <div className="kartu grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className="input lg:col-span-2"
          placeholder="Cari no. dokumen / tujuan…"
          value={filter.q}
          onChange={(e) => ubah('q', e.target.value)}
        />
        <select className="input" value={filter.tipe} onChange={(e) => ubah('tipe', e.target.value)}>
          <option value="">Semua tipe</option>
          <option value="MASUK">Barang masuk</option>
          <option value="KELUAR">Barang keluar</option>
          <option value="PENYESUAIAN">Stock opname</option>
        </select>
        <select className="input" value={filter.status} onChange={(e) => ubah('status', e.target.value)}>
          <option value="">Semua status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input" value={filter.dari} onChange={(e) => ubah('dari', e.target.value)} />
          <input type="date" className="input" value={filter.ke} onChange={(e) => ubah('ke', e.target.value)} />
        </div>
      </div>

      <div className="kartu overflow-hidden">
        {memuat ? (
          <KerangkaBaris jumlah={6} />
        ) : data.items.length === 0 ? (
          <EmptyState ikon="🕘" judul="Belum ada transaksi" pesan="Coba ubah filter atau catat transaksi baru." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Dokumen</th>
                    <th>Tipe</th>
                    <th>Keterangan</th>
                    <th className="text-right">Item</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t) => {
                    const meta = TIPE_TRANSAKSI[t.tipe] || TIPE_TRANSAKSI.MASUK;
                    return (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap">{tanggal(t.tanggal)}</td>
                        <td className="whitespace-nowrap text-xs">{t.noDokumen || '-'}</td>
                        <td>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.kelas}`}>
                            {meta.ikon} {meta.singkat}
                          </span>
                        </td>
                        <td className="max-w-xs truncate text-sm">
                          {t.supplier?.nama || t.tujuan || t.alasan || '-'}
                          <span className="block text-xs text-inkl">oleh {t.dibuatOleh?.nama || '-'}</span>
                        </td>
                        <td className="text-right">{t.items.length}</td>
                        <td>
                          <BadgeTransaksi status={t.status} />
                        </td>
                        <td className="text-right">
                          <button type="button" className="btn-sekunder btn-kecil" onClick={() => bukaDetail(t.id)}>
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {data.items.map((t) => {
                const meta = TIPE_TRANSAKSI[t.tipe] || TIPE_TRANSAKSI.MASUK;
                return (
                  <li key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className={`grid h-9 w-9 place-items-center rounded-lg ${meta.kelas}`}>{meta.ikon}</span>
                        <div>
                          <p className="text-sm font-medium">{t.noDokumen || meta.label}</p>
                          <p className="text-xs text-inkl">{tanggal(t.tanggal)}</p>
                        </div>
                      </div>
                      <BadgeTransaksi status={t.status} />
                    </div>
                    <p className="mt-2 text-xs text-inkl">
                      {t.supplier?.nama || t.tujuan || t.alasan || '-'} · {t.items.length} barang
                    </p>
                    <button
                      type="button"
                      className="btn-sekunder btn-kecil mt-2"
                      onClick={() => bukaDetail(t.id)}
                    >
                      Detail
                    </button>
                  </li>
                );
              })}
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

      {/* Detail transaksi */}
      <Modal
        buka={Boolean(detail)}
        onTutup={() => setDetail(null)}
        judul={detail ? `Detail ${TIPE_TRANSAKSI[detail.tipe]?.label || 'Transaksi'}` : ''}
        subjudul={detail?.noDokumen || ''}
        footer={
          <button type="button" className="btn-sekunder" onClick={() => setDetail(null)}>
            Tutup
          </button>
        }
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                <span className="text-inkl">Tanggal: </span>
                {tanggal(detail.tanggal)}
              </p>
              <p>
                <span className="text-inkl">Status: </span>
                <BadgeTransaksi status={detail.status} />
              </p>
              <p>
                <span className="text-inkl">Dicatat oleh: </span>
                {detail.dibuatOleh?.nama || '-'}
              </p>
              <p>
                <span className="text-inkl">Disetujui oleh: </span>
                {detail.disetujuiOleh?.nama || '-'}
              </p>
              {detail.supplier && (
                <p>
                  <span className="text-inkl">Supplier: </span>
                  {detail.supplier.nama}
                </p>
              )}
              {detail.tujuan && (
                <p className="sm:col-span-2">
                  <span className="text-inkl">Tujuan: </span>
                  {detail.tujuan}
                </p>
              )}
              {detail.alasan && (
                <p className="sm:col-span-2">
                  <span className="text-inkl">Alasan: </span>
                  {detail.alasan}
                </p>
              )}
              {detail.catatanTolak && (
                <p className="sm:col-span-2 rounded-xl bg-habiss px-3 py-2 text-habis">
                  Ditolak: {detail.catatanTolak}
                </p>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Batch</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <p className="font-medium">{it.barang?.nama}</p>
                        <p className="text-xs text-inkl">{it.barang?.sku}</p>
                      </td>
                      <td className="text-xs">
                        {it.batch?.batchNo || '-'}
                        {it.batch?.expiredAt && (
                          <span className="block text-inkl">exp {tanggal(it.batch.expiredAt)}</span>
                        )}
                      </td>
                      <td className="text-right font-semibold">
                        {detail.tipe === 'PENYESUAIAN' && it.qty > 0 ? '+' : ''}
                        {angka(it.qty)} {it.barang?.satuan}
                        {it.stokFisik !== null && it.stokFisik !== undefined && (
                          <span className="block text-xs font-normal text-inkl">
                            sistem {angka(it.stokSistem)} → fisik {angka(it.stokFisik)}
                          </span>
                        )}
                      </td>
                      <td className="text-right">{it.harga ? `Rp ${it.harga.toLocaleString('id-ID')}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-inkl">Dibuat {waktu(detail.createdAt)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
