import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { angka, inputTanggal, tanggal, TIPE_TRANSAKSI } from '../lib/format.js';
import { BadgeStok, ChipKategori, EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';

/** Kartu stok: riwayat pergerakan satu barang + saldo berjalan. */
export default function KartuStok() {
  const { id } = useParams();
  const [dari, setDari] = useState('');
  const [ke, setKe] = useState('');
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    let aktif = true;
    setMemuat(true);
    api
      .get(`/barang/${id}/kartu-stok${qs({ dari, ke })}`)
      .then((d) => aktif && setData(d))
      .catch((e) => aktif && setGalat(e.message))
      .finally(() => aktif && setMemuat(false));
    return () => {
      aktif = false;
    };
  }, [id, dari, ke]);

  if (galat) {
    return (
      <div className="kartu p-6 text-sm text-habis">
        {galat}{' '}
        <Link to="/barang" className="font-semibold text-laut underline">
          Balik ke daftar barang
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/barang" className="text-sm font-semibold text-laut">
        ← Kembali ke daftar barang
      </Link>

      {memuat && !data ? (
        <div className="kartu">
          <KerangkaBaris jumlah={6} />
        </div>
      ) : (
        <>
          <div className="kartu p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">{data.barang.nama}</h1>
                <p className="mt-1 text-sm text-inkl">
                  {data.barang.sku} · {data.barang.satuan}
                </p>
                <div className="mt-2">
                  <ChipKategori kategori={data.barang.kategori} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-inkl">Stok sekarang</p>
                <p className="text-3xl font-bold leading-tight">
                  {angka(data.barang.stok)}{' '}
                  <span className="text-sm font-medium text-inkl">{data.barang.satuan}</span>
                </p>
                <div className="mt-1 flex justify-end">
                  <BadgeStok
                    status={
                      data.barang.stok <= 0
                        ? 'HABIS'
                        : data.barang.stok <= data.barang.stokMin
                          ? 'MENIPIS'
                          : 'AMAN'
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="kartu grid gap-2 p-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="dari">
                Dari tanggal
              </label>
              <input
                id="dari"
                type="date"
                className="input"
                value={dari}
                max={ke || inputTanggal()}
                onChange={(e) => setDari(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="ke">
                Sampai tanggal
              </label>
              <input
                id="ke"
                type="date"
                className="input"
                value={ke}
                min={dari}
                onChange={(e) => setKe(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="btn-sekunder w-full"
                onClick={() => {
                  setDari('');
                  setKe('');
                }}
                disabled={!dari && !ke}
              >
                Reset periode
              </button>
            </div>
          </div>

          <div className="kartu overflow-hidden">
            {data.items.length === 0 ? (
              <EmptyState
                ikon="🧾"
                judul="Belum ada pergerakan"
                pesan="Barang ini belum punya transaksi yang disetujui pada periode ini."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="tabel">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Dokumen</th>
                        <th>Tipe</th>
                        <th>Batch</th>
                        <th className="text-right">Masuk</th>
                        <th className="text-right">Keluar</th>
                        <th className="text-right">Saldo</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((b) => {
                        const meta = TIPE_TRANSAKSI[b.tipe] || TIPE_TRANSAKSI.MASUK;
                        return (
                          <tr key={b.id}>
                            <td className="whitespace-nowrap">{tanggal(b.tanggal)}</td>
                            <td className="whitespace-nowrap text-xs">{b.noDokumen || '-'}</td>
                            <td>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.kelas}`}>
                                {meta.singkat}
                              </span>
                            </td>
                            <td className="text-xs">{b.batchNo}</td>
                            <td className="text-right font-semibold text-aman">
                              {b.masuk ? angka(b.masuk) : '-'}
                            </td>
                            <td className="text-right font-semibold text-habis">
                              {b.keluar ? angka(b.keluar) : '-'}
                            </td>
                            <td className="text-right font-bold">{angka(b.saldo)}</td>
                            <td className="max-w-xs truncate text-xs text-inkl">{b.keterangan}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
                  <span className="text-inkl">
                    {data.items.length} baris pergerakan · periode{' '}
                    {dari || ke ? `${dari || '…'} s/d ${ke || '…'}` : 'semua'}
                  </span>
                  <span className="font-semibold">Saldo akhir: {angka(data.saldoAkhir)}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
