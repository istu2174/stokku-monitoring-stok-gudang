import { useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { tanggal } from '../lib/format.js';
import { EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';
import Modal from '../components/Modal.jsx';
import Konfirmasi from '../components/Konfirmasi.jsx';

const KOSONG = { nama: '', kontak: '', alamat: '', catatan: '', aktif: true };

export default function Supplier() {
  const { boleh } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [hapus, setHapus] = useState(null);
  const [sedangHapus, setSedangHapus] = useState(false);

  const bisaKelola = boleh('kelolaSupplier');

  async function muat(kata = q) {
    setMemuat(true);
    try {
      const data = await api.get(`/supplier${qs({ q: kata, limit: 100 })}`);
      setItems(data.items);
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => muat(q), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function simpan(e) {
    e.preventDefault();
    setSedangSimpan(true);
    try {
      if (form.id) {
        await api.put(`/supplier/${form.id}`, form);
        toast.sukses('Supplier diperbarui.');
      } else {
        await api.post('/supplier', form);
        toast.sukses('Supplier ditambahkan.');
      }
      setForm(null);
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangSimpan(false);
    }
  }

  async function konfirmasiHapus() {
    setSedangHapus(true);
    try {
      await api.del(`/supplier/${hapus.id}`);
      toast.sukses('Supplier dihapus.');
      setHapus(null);
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangHapus(false);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Supplier"
        keterangan="Daftar pemasok untuk pencatatan barang masuk."
        aksi={
          bisaKelola && (
            <button type="button" className="btn-utama" onClick={() => setForm({ ...KOSONG })}>
              + Tambah Supplier
            </button>
          )
        }
      />

      <div className="kartu p-3">
        <input
          className="input"
          placeholder="Cari nama supplier…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="kartu overflow-hidden">
        {memuat ? (
          <KerangkaBaris jumlah={5} />
        ) : items.length === 0 ? (
          <EmptyState
            ikon="🚚"
            judul="Belum ada supplier"
            pesan="Tambahkan supplier supaya barang masuk bisa dicatat asal pemasoknya."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Kontak</th>
                    <th>Alamat</th>
                    <th className="text-right">Transaksi</th>
                    <th>Status</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <p className="font-medium">{s.nama}</p>
                        <p className="text-xs text-inkl">Ditambah {tanggal(s.createdAt)}</p>
                      </td>
                      <td>{s.kontak || '-'}</td>
                      <td className="max-w-xs truncate">{s.alamat || '-'}</td>
                      <td className="text-right">{s.jumlahTransaksi}</td>
                      <td>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            s.aktif ? 'bg-amans text-aman' : 'bg-slate-100 text-inkl'
                          }`}
                        >
                          {s.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        {bisaKelola && (
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="btn-sekunder btn-kecil"
                              onClick={() => setForm({ ...s })}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-kecil rounded-xl text-habis ring-1 ring-habis/30 hover:bg-habiss"
                              onClick={() => setHapus(s)}
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((s) => (
                <li key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{s.nama}</p>
                      <p className="text-xs text-inkl">{s.kontak || 'Tanpa kontak'}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        s.aktif ? 'bg-amans text-aman' : 'bg-slate-100 text-inkl'
                      }`}
                    >
                      {s.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  {s.alamat && <p className="mt-1 text-xs text-inkl">{s.alamat}</p>}
                  {bisaKelola && (
                    <div className="mt-3 flex gap-2">
                      <button type="button" className="btn-sekunder btn-kecil" onClick={() => setForm({ ...s })}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-kecil rounded-xl text-habis ring-1 ring-habis/30"
                        onClick={() => setHapus(s)}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Modal
        buka={Boolean(form)}
        onTutup={() => setForm(null)}
        judul={form?.id ? 'Edit Supplier' : 'Tambah Supplier'}
        lebar="max-w-lg"
        footer={
          <>
            <button type="button" className="btn-sekunder" onClick={() => setForm(null)}>
              Batal
            </button>
            <button type="submit" form="form-supplier" className="btn-utama" disabled={sedangSimpan}>
              {sedangSimpan ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        }
      >
        {form && (
          <form id="form-supplier" onSubmit={simpan} className="space-y-4">
            <div>
              <label className="label" htmlFor="nama-supplier">
                Nama supplier *
              </label>
              <input
                id="nama-supplier"
                className="input"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="kontak">
                Kontak
              </label>
              <input
                id="kontak"
                className="input"
                value={form.kontak || ''}
                onChange={(e) => setForm({ ...form, kontak: e.target.value })}
                placeholder="Nomor HP / email"
              />
            </div>
            <div>
              <label className="label" htmlFor="alamat">
                Alamat
              </label>
              <textarea
                id="alamat"
                className="input min-h-[80px]"
                value={form.alamat || ''}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="catatan-supplier">
                Catatan
              </label>
              <input
                id="catatan-supplier"
                className="input"
                value={form.catatan || ''}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                placeholder="misal: termin 30 hari"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-laut focus:ring-laut"
                checked={form.aktif ?? true}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
              />
              Supplier aktif
            </label>
          </form>
        )}
      </Modal>

      <Konfirmasi
        buka={Boolean(hapus)}
        onTutup={() => setHapus(null)}
        onYa={konfirmasiHapus}
        judul="Hapus supplier ini?"
        pesan={
          hapus
            ? `"${hapus.nama}" akan dihapus. Supplier yang sudah dipakai transaksi otomatis ditolak, kamu bisa menonaktifkannya saja.`
            : ''
        }
        labelYa="Ya, hapus"
        bahaya
        sedangProses={sedangHapus}
      />
    </div>
  );
}
