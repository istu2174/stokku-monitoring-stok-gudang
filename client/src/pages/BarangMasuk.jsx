import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import { angka, inputTanggal, rupiah } from '../lib/format.js';
import { EmptyState, JudulHalaman } from '../components/Ui.jsx';
import PemilihBarang from '../components/PemilihBarang.jsx';

/** Form pencatatan barang masuk (langsung menambah stok). */
export default function BarangMasuk() {
  const toast = useToast();

  const [supplier, setSupplier] = useState([]);
  const [tanggal, setTanggal] = useState(inputTanggal());
  const [supplierId, setSupplierId] = useState('');
  const [noDokumen, setNoDokumen] = useState('');
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState([]);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [berhasil, setBerhasil] = useState('');

  useEffect(() => {
    api
      .get('/supplier?limit=100')
      .then((d) => setSupplier(d.items.filter((s) => s.aktif)))
      .catch(() => setSupplier([]));
  }, []);

  function tambahBarang(barang) {
    setItems((lama) => {
      if (lama.some((it) => it.barang.id === barang.id)) {
        toast.info('Barang ini sudah ada di daftar.');
        return lama;
      }
      return [
        ...lama,
        {
          barang,
          qty: '',
          batchNo: '',
          expiredAt: '',
          harga: barang.hargaBeli || '',
        },
      ];
    });
  }

  function ubahItem(id, kunci, nilai) {
    setItems((lama) => lama.map((it) => (it.barang.id === id ? { ...it, [kunci]: nilai } : it)));
  }

  function hapusItem(id) {
    setItems((lama) => lama.filter((it) => it.barang.id !== id));
  }

  const total = items.reduce((jumlah, it) => jumlah + (Number(it.qty) || 0) * (Number(it.harga) || 0), 0);

  async function kirim(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.gagal('Tambahkan minimal satu barang.');
      return;
    }
    setSedangKirim(true);
    setBerhasil('');
    try {
      await api.post('/transaksi/masuk', {
        tanggal,
        supplierId: supplierId || null,
        noDokumen: noDokumen || undefined,
        tujuan: catatan || undefined,
        items: items.map((it) => ({
          barangId: it.barang.id,
          qty: Number(it.qty),
          batchNo: it.batchNo || '-',
          expiredAt: it.expiredAt || null,
          harga: Number(it.harga) || 0,
        })),
      });
      toast.sukses('Barang masuk tersimpan, stok sudah bertambah.');
      setBerhasil('Barang masuk berhasil dicatat. Stok sudah diperbarui.');
      setItems([]);
      setNoDokumen('');
      setCatatan('');
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Barang Masuk"
        keterangan="Penerimaan barang dari supplier. Stok langsung bertambah setelah disimpan."
      />

      {berhasil && (
        <div className="kartu flex flex-wrap items-center justify-between gap-2 border-l-4 border-aman p-4 text-sm">
          <span className="text-aman">{berhasil}</span>
          <Link to="/riwayat" className="font-semibold text-laut">
            Lihat riwayat →
          </Link>
        </div>
      )}

      <form onSubmit={kirim} className="space-y-4">
        <div className="kartu grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="tanggal">
              Tanggal terima *
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
          <div>
            <label className="label" htmlFor="supplier">
              Supplier
            </label>
            <select
              id="supplier"
              className="input"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Tanpa supplier</option>
              {supplier.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
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
          <div>
            <label className="label" htmlFor="catatan">
              Catatan
            </label>
            <input
              id="catatan"
              className="input"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="misal: kiriman pagi"
            />
          </div>
        </div>

        <div className="kartu p-4">
          <label className="label">Tambah barang</label>
          <PemilihBarang onPilih={tambahBarang} />
          <p className="mt-1.5 text-xs text-inkl">
            Cari lalu klik barangnya. Batch & expired penting untuk aturan FEFO saat barang keluar.
          </p>
        </div>

        <div className="kartu overflow-hidden">
          {items.length === 0 ? (
            <EmptyState
              ikon="📥"
              judul="Belum ada barang"
              pesan="Cari barang di atas untuk mulai mencatat penerimaan."
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Barang</th>
                      <th className="w-28">Qty</th>
                      <th className="w-32">Batch</th>
                      <th className="w-40">Expired</th>
                      <th className="w-32">Harga beli</th>
                      <th className="text-right">Subtotal</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.barang.id}>
                        <td>
                          <p className="font-medium">{it.barang.nama}</p>
                          <p className="text-xs text-inkl">
                            {it.barang.sku} · stok sekarang {angka(it.barang.stok)} {it.barang.satuan}
                          </p>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="input py-1.5"
                            value={it.qty}
                            onChange={(e) => ubahItem(it.barang.id, 'qty', e.target.value)}
                            placeholder="0"
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="input py-1.5"
                            value={it.batchNo}
                            onChange={(e) => ubahItem(it.barang.id, 'batchNo', e.target.value)}
                            placeholder="-"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="input py-1.5"
                            value={it.expiredAt}
                            onChange={(e) => ubahItem(it.barang.id, 'expiredAt', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="input py-1.5"
                            value={it.harga}
                            onChange={(e) => ubahItem(it.barang.id, 'harga', e.target.value)}
                          />
                        </td>
                        <td className="text-right font-semibold">
                          {rupiah((Number(it.qty) || 0) * (Number(it.harga) || 0))}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => hapusItem(it.barang.id)}
                            className="rounded-lg px-2 py-1 text-habis hover:bg-habiss"
                            aria-label="Hapus baris"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {items.map((it) => (
                  <li key={it.barang.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{it.barang.nama}</p>
                        <p className="text-xs text-inkl">
                          {it.barang.sku} · {it.barang.satuan}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => hapusItem(it.barang.id)}
                        className="rounded-lg px-2 py-1 text-habis"
                        aria-label="Hapus baris"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Qty</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="input"
                          value={it.qty}
                          onChange={(e) => ubahItem(it.barang.id, 'qty', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Harga beli</label>
                        <input
                          type="number"
                          min="0"
                          className="input"
                          value={it.harga}
                          onChange={(e) => ubahItem(it.barang.id, 'harga', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Batch</label>
                        <input
                          className="input"
                          value={it.batchNo}
                          onChange={(e) => ubahItem(it.barang.id, 'batchNo', e.target.value)}
                          placeholder="-"
                        />
                      </div>
                      <div>
                        <label className="label">Expired</label>
                        <input
                          type="date"
                          className="input"
                          value={it.expiredAt}
                          onChange={(e) => ubahItem(it.barang.id, 'expiredAt', e.target.value)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Aksi simpan */}
        <div className="kartu sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 p-4 lg:bottom-4">
          <div>
            <p className="text-xs text-inkl">Total nilai penerimaan</p>
            <p className="text-lg font-bold">{rupiah(total)}</p>
          </div>
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
              {sedangKirim ? 'Menyimpan…' : 'Simpan Barang Masuk'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
