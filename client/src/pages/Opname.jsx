import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { angka, inputTanggal } from '../lib/format.js';
import { EmptyState, JudulHalaman } from '../components/Ui.jsx';
import PemilihBarang from '../components/PemilihBarang.jsx';
import Konfirmasi from '../components/Konfirmasi.jsx';

/** Stock opname: masukkan hasil hitung fisik, selisih menunggu approval. */
export default function Opname() {
  const toast = useToast();

  const [tanggal, setTanggal] = useState(inputTanggal());
  const [alasan, setAlasan] = useState('');
  const [items, setItems] = useState([]);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [berhasil, setBerhasil] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);

  function tambahBarang(barang) {
    setItems((lama) => {
      if (lama.some((it) => it.barang.id === barang.id)) {
        toast.info('Barang ini sudah ada di daftar.');
        return lama;
      }
      return [...lama, { barang, stokFisik: '' }];
    });
  }

  function ubahFisik(id, nilai) {
    setItems((lama) => lama.map((it) => (it.barang.id === id ? { ...it, stokFisik: nilai } : it)));
  }

  function hapusItem(id) {
    setItems((lama) => lama.filter((it) => it.barang.id !== id));
  }

  const adaSelisih = items.some((it) => Number(it.stokFisik) !== Number(it.barang.stok));

  async function kirim() {
    setSedangKirim(true);
    setBerhasil('');
    try {
      await api.post('/transaksi/opname', {
        tanggal,
        alasan,
        items: items.map((it) => ({ barangId: it.barang.id, stokFisik: Number(it.stokFisik) })),
      });
      toast.sukses('Pengajuan penyesuaian terkirim.');
      setBerhasil('Pengajuan stock opname terkirim. Stok berubah setelah disetujui Manajer/Kepala.');
      setItems([]);
      setAlasan('');
      setKonfirmasi(false);
    } catch (err) {
      toast.gagal(err.message);
      setKonfirmasi(false);
    } finally {
      setSedangKirim(false);
    }
  }

  function cobaKirim(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.gagal('Tambahkan minimal satu barang.');
      return;
    }
    if (!adaSelisih) {
      toast.gagal('Tidak ada selisih stok, jadi tidak perlu penyesuaian.');
      return;
    }
    setKonfirmasi(true);
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Stock Opname"
        keterangan="Catat hasil hitung fisik. Selisih dengan sistem diajukan untuk persetujuan."
      />

      {berhasil && (
        <div className="kartu flex flex-wrap items-center justify-between gap-2 border-l-4 border-menipis p-4 text-sm">
          <span className="text-menipis">{berhasil}</span>
          <Link to="/persetujuan" className="font-semibold text-laut">
            Cek persetujuan →
          </Link>
        </div>
      )}

      <form onSubmit={cobaKirim} className="space-y-4">
        <div className="kartu grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="tanggal">
              Tanggal opname *
            </label>
            <input
              id="tanggal"
              type="date"
              className="input"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="alasan">
              Alasan penyesuaian *
            </label>
            <input
              id="alasan"
              className="input"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="misal: stok opname bulanan, barang rusak, selisih hitung"
              required
            />
          </div>
        </div>

        <div className="kartu p-4">
          <label className="label">Tambah barang yang dihitung</label>
          <PemilihBarang onPilih={tambahBarang} placeholder="Cari barang yang mau diopname…" />
        </div>

        <div className="kartu overflow-hidden">
          {items.length === 0 ? (
            <EmptyState
              ikon="⚖️"
              judul="Belum ada barang"
              pesan="Pilih barang, lalu masukkan jumlah hasil hitung fisiknya."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((it) => {
                const sistem = Number(it.barang.stok);
                const fisik = it.stokFisik === '' ? null : Number(it.stokFisik);
                const selisih = fisik === null ? null : fisik - sistem;
                return (
                  <li key={it.barang.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{it.barang.nama}</p>
                      <p className="text-xs text-inkl">
                        {it.barang.sku} · stok sistem {angka(sistem)} {it.barang.satuan}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-inkl">Stok fisik</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input w-24 py-2 text-right"
                          value={it.stokFisik}
                          onChange={(e) => ubahFisik(it.barang.id, e.target.value)}
                          placeholder={String(sistem)}
                          required
                        />
                      </div>
                      <div className="w-20 text-right">
                        <p className="mb-1 text-[11px] font-medium text-inkl">Selisih</p>
                        <p
                          className={`text-sm font-bold ${
                            selisih === null || selisih === 0
                              ? 'text-inkl'
                              : selisih > 0
                                ? 'text-aman'
                                : 'text-habis'
                          }`}
                        >
                          {selisih === null ? '-' : `${selisih > 0 ? '+' : ''}${angka(selisih)}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => hapusItem(it.barang.id)}
                        className="mt-4 rounded-lg px-2 py-1 text-habis hover:bg-habiss"
                        aria-label="Hapus baris"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="kartu sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 p-4 lg:bottom-4">
          <p className="text-xs text-inkl">
            {items.length} barang · {adaSelisih ? 'ada selisih' : 'belum ada selisih'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-sekunder"
              onClick={() => setItems([])}
              disabled={items.length === 0 || sedangKirim}
            >
              Kosongkan
            </button>
            <button type="submit" className="btn-utama" disabled={sedangKirim || items.length === 0}>
              Ajukan Penyesuaian
            </button>
          </div>
        </div>
      </form>

      <Konfirmasi
        buka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        onYa={kirim}
        judul="Ajukan penyesuaian stok?"
        pesan={`${items.length} barang akan disesuaikan dengan hasil hitung fisik. Perubahan stok berlaku setelah disetujui.`}
        labelYa="Ya, ajukan"
        sedangProses={sedangKirim}
      />
    </div>
  );
}
