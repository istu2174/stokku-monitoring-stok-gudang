import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { angka, inputTanggal } from '../lib/format.js';
import { BadgeStok, EmptyState, JudulHalaman } from '../components/Ui.jsx';
import PemilihBarang from '../components/PemilihBarang.jsx';
import Konfirmasi from '../components/Konfirmasi.jsx';

/** Pengajuan barang keluar; stok dipotong setelah disetujui Kepala/Manajer. */
export default function BarangKeluar() {
  const toast = useToast();

  const [tanggal, setTanggal] = useState(inputTanggal());
  const [tujuan, setTujuan] = useState('');
  const [noDokumen, setNoDokumen] = useState('');
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
      return [...lama, { barang, qty: '' }];
    });
  }

  function ubahQty(id, nilai) {
    setItems((lama) => lama.map((it) => (it.barang.id === id ? { ...it, qty: nilai } : it)));
  }

  function hapusItem(id) {
    setItems((lama) => lama.filter((it) => it.barang.id !== id));
  }

  function adaMelebihiStok() {
    return items.some((it) => Number(it.qty) > Number(it.barang.stok));
  }

  async function kirim() {
    setSedangKirim(true);
    setBerhasil('');
    try {
      await api.post('/transaksi/keluar', {
        tanggal,
        tujuan,
        noDokumen: noDokumen || undefined,
        items: items.map((it) => ({ barangId: it.barang.id, qty: Number(it.qty) })),
      });
      toast.sukses('Pengajuan terkirim, menunggu persetujuan.');
      setBerhasil(
        'Pengajuan barang keluar sudah masuk antrean persetujuan. Stok belum berkurang sampai disetujui.',
      );
      setItems([]);
      setTujuan('');
      setNoDokumen('');
      setKonfirmasi(false);
    } catch (err) {
      toast.gagal(err.message);
      setKonfirmasi(false);
    } finally {
      setSedangKirim(false);
    }
  }

  function cobaAjukan(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.gagal('Tambahkan minimal satu barang.');
      return;
    }
    if (adaMelebihiStok()) {
      toast.gagal('Ada qty yang melebihi stok tersedia. Periksa lagi ya.');
      return;
    }
    setKonfirmasi(true);
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Barang Keluar"
        keterangan="Pengajuan pengambilan barang. Perlu persetujuan Kepala Gudang atau Manajer."
      />

      {berhasil && (
        <div className="kartu flex flex-wrap items-center justify-between gap-2 border-l-4 border-menipis p-4 text-sm">
          <span className="text-menipis">{berhasil}</span>
          <Link to="/riwayat" className="font-semibold text-laut">
            Lihat status →
          </Link>
        </div>
      )}

      <form onSubmit={cobaAjukan} className="space-y-4">
        <div className="kartu grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="tanggal">
              Tanggal keluar *
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
            <label className="label" htmlFor="tujuan">
              Tujuan / bagian pengambil *
            </label>
            <input
              id="tujuan"
              className="input"
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="misal: Produksi, Cabang Bandung, Perbaikan mess"
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="noDokumen">
              No. dokumen
            </label>
            <input
              id="noDokumen"
              className="input"
              value={noDokumen}
              onChange={(e) => setNoDokumen(e.target.value)}
              placeholder="otomatis kalau kosong"
            />
          </div>
        </div>

        <div className="kartu p-4">
          <label className="label">Tambah barang</label>
          <PemilihBarang onPilih={tambahBarang} />
        </div>

        <div className="kartu overflow-hidden">
          {items.length === 0 ? (
            <EmptyState
              ikon="📤"
              judul="Belum ada barang"
              pesan="Cari barang yang mau diambil, lalu isi qty-nya."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((it) => {
                const lebih = Number(it.qty) > Number(it.barang.stok);
                return (
                  <li key={it.barang.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{it.barang.nama}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-inkl">
                        <span>
                          {it.barang.sku} · stok {angka(it.barang.stok)} {it.barang.satuan}
                        </span>
                        <BadgeStok status={it.barang.status} />
                      </div>
                      {lebih && (
                        <p className="mt-1 text-xs font-medium text-habis">
                          Qty melebihi stok yang ada.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={`input w-24 py-2 text-right ${lebih ? 'border-habis' : ''}`}
                        value={it.qty}
                        onChange={(e) => ubahQty(it.barang.id, e.target.value)}
                        placeholder="0"
                        required
                      />
                      <span className="text-xs text-inkl">{it.barang.satuan}</span>
                      <button
                        type="button"
                        onClick={() => hapusItem(it.barang.id)}
                        className="rounded-lg px-2 py-1 text-habis hover:bg-habiss"
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
            {items.length} baris · stok baru berkurang setelah disetujui
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
              Ajukan Persetujuan
            </button>
          </div>
        </div>
      </form>

      <Konfirmasi
        buka={konfirmasi}
        onTutup={() => setKonfirmasi(false)}
        onYa={kirim}
        judul="Kirim pengajuan barang keluar?"
        pesan={`${items.length} barang untuk tujuan "${tujuan}". Stok belum berkurang sampai disetujui atasan.`}
        labelYa="Ya, kirim"
        sedangProses={sedangKirim}
      />
    </div>
  );
}
