import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { angka, rupiah } from '../lib/format.js';
import {
  BadgeStok,
  ChipKategori,
  EmptyState,
  JudulHalaman,
  KerangkaBaris,
  Pagination,
} from '../components/Ui.jsx';
import Modal from '../components/Modal.jsx';
import Konfirmasi from '../components/Konfirmasi.jsx';

const FORM_KOSONG = {
  nama: '',
  kategoriId: '',
  satuan: 'pcs',
  stokMin: 0,
  hargaBeli: 0,
  lokasiRak: '',
  aktif: true,
};

export default function Barang() {
  const { boleh } = useAuth();
  const toast = useToast();
  const [cari, setCari] = useSearchParams();

  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [kategori, setKategori] = useState([]);
  const [memuat, setMemuat] = useState(true);

  const q = cari.get('q') || '';
  const kategoriId = cari.get('kategoriId') || '';
  const status = cari.get('status') || '';
  const page = Number(cari.get('page') || 1);

  const [form, setForm] = useState(null); // { id?, ...nilai }
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [hapus, setHapus] = useState(null);
  const [sedangHapus, setSedangHapus] = useState(false);

  async function muat() {
    setMemuat(true);
    try {
      const hasil = await api.get(
        `/barang${qs({ q, kategoriId, status, page, limit: 10, sort: 'nama', order: 'asc' })}`,
      );
      setData(hasil);
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, kategoriId, status, page]);

  useEffect(() => {
    api
      .get('/kategori')
      .then((d) => setKategori(d.items))
      .catch(() => setKategori([]));
  }, []);

  function ubahFilter(kunci, nilai) {
    const baru = new URLSearchParams(cari);
    if (nilai) baru.set(kunci, nilai);
    else baru.delete(kunci);
    if (kunci !== 'page') baru.delete('page');
    setCari(baru);
  }

  async function simpan(e) {
    e.preventDefault();
    setSedangSimpan(true);
    try {
      const isi = {
        nama: form.nama,
        kategoriId: form.kategoriId,
        satuan: form.satuan,
        stokMin: Number(form.stokMin) || 0,
        hargaBeli: Number(form.hargaBeli) || 0,
        lokasiRak: form.lokasiRak,
        aktif: form.aktif,
      };
      if (form.id) {
        await api.put(`/barang/${form.id}`, isi);
        toast.sukses('Barang berhasil diperbarui.');
      } else {
        const baru = await api.post('/barang', isi);
        toast.sukses(`Barang ditambahkan dengan SKU ${baru.sku}.`);
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
      await api.del(`/barang/${hapus.id}`);
      toast.sukses('Barang dihapus.');
      setHapus(null);
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangHapus(false);
    }
  }

  const bisaKelola = boleh('kelolaBarang');

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Data Barang"
        keterangan="Stok dihitung otomatis dari batch yang masuk."
        aksi={
          bisaKelola && (
            <button
              type="button"
              className="btn-utama"
              onClick={() => setForm({ ...FORM_KOSONG, kategoriId: kategori[0]?.id || '' })}
            >
              + Tambah Barang
            </button>
          )
        }
      />

      {/* Filter */}
      <div className="kartu grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Cari nama, SKU, atau rak…"
          value={q}
          onChange={(e) => ubahFilter('q', e.target.value)}
        />
        <select className="input" value={kategoriId} onChange={(e) => ubahFilter('kategoriId', e.target.value)}>
          <option value="">Semua kategori</option>
          {kategori.map((k) => (
            <option key={k.id} value={k.id}>
              {k.ikon} {k.nama}
            </option>
          ))}
        </select>
        <select className="input" value={status} onChange={(e) => ubahFilter('status', e.target.value)}>
          <option value="">Semua status stok</option>
          <option value="AMAN">Aman</option>
          <option value="MENIPIS">Menipis</option>
          <option value="HABIS">Habis</option>
        </select>
        {(q || kategoriId || status) && (
          <button type="button" className="btn-sekunder" onClick={() => setCari(new URLSearchParams())}>
            Reset filter
          </button>
        )}
      </div>

      <div className="kartu overflow-hidden">
        {memuat ? (
          <KerangkaBaris jumlah={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            ikon="📦"
            judul="Barang belum ada"
            pesan={
              q || kategoriId || status
                ? 'Nggak ada barang yang cocok dengan filter ini.'
                : 'Tambahkan barang pertama, atau jalankan seed untuk data contoh.'
            }
            aksi={
              bisaKelola && (
                <button
                  type="button"
                  className="btn-utama"
                  onClick={() => setForm({ ...FORM_KOSONG, kategoriId: kategori[0]?.id || '' })}
                >
                  + Tambah Barang
                </button>
              )
            }
          />
        ) : (
          <>
            {/* Tabel (desktop) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Kategori</th>
                    <th className="text-right">Stok</th>
                    <th className="text-right">Min</th>
                    <th>Status</th>
                    <th>Rak</th>
                    <th className="text-right">Harga Beli</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <p className="font-medium text-ink">{b.nama}</p>
                        <p className="text-xs text-inkl">{b.sku}</p>
                      </td>
                      <td>
                        <ChipKategori kategori={b.kategori} />
                      </td>
                      <td className="text-right font-semibold">
                        {angka(b.stok)} <span className="text-xs font-normal text-inkl">{b.satuan}</span>
                      </td>
                      <td className="text-right text-inkl">{angka(b.stokMin)}</td>
                      <td>
                        <BadgeStok status={b.status} />
                      </td>
                      <td className="text-inkl">{b.lokasiRak || '-'}</td>
                      <td className="text-right">{rupiah(b.hargaBeli)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          {boleh('lihatLaporan') && (
                            <Link to={`/barang/${b.id}/kartu-stok`} className="btn-sekunder btn-kecil">
                              Kartu
                            </Link>
                          )}
                          {bisaKelola && (
                            <>
                              <button
                                type="button"
                                className="btn-sekunder btn-kecil"
                                onClick={() =>
                                  setForm({
                                    id: b.id,
                                    nama: b.nama,
                                    kategoriId: b.kategori?.id || '',
                                    satuan: b.satuan,
                                    stokMin: b.stokMin,
                                    hargaBeli: b.hargaBeli,
                                    lokasiRak: b.lokasiRak || '',
                                    aktif: b.aktif,
                                  })
                                }
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-kecil rounded-xl text-habis ring-1 ring-habis/30 hover:bg-habiss"
                                onClick={() => setHapus(b)}
                              >
                                Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Kartu (mobile) */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {data.items.map((b) => (
                <li key={b.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.nama}</p>
                      <p className="text-xs text-inkl">{b.sku}</p>
                    </div>
                    <BadgeStok status={b.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ChipKategori kategori={b.kategori} />
                    <span className="text-xs text-inkl">
                      Stok {angka(b.stok)} {b.satuan} · min {angka(b.stokMin)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {boleh('lihatLaporan') && (
                      <Link to={`/barang/${b.id}/kartu-stok`} className="btn-sekunder btn-kecil">
                        Kartu stok
                      </Link>
                    )}
                    {bisaKelola && (
                      <>
                        <button
                          type="button"
                          className="btn-sekunder btn-kecil"
                          onClick={() =>
                            setForm({
                              id: b.id,
                              nama: b.nama,
                              kategoriId: b.kategori?.id || '',
                              satuan: b.satuan,
                              stokMin: b.stokMin,
                              hargaBeli: b.hargaBeli,
                              lokasiRak: b.lokasiRak || '',
                              aktif: b.aktif,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-kecil rounded-xl text-habis ring-1 ring-habis/30"
                          onClick={() => setHapus(b)}
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPindah={(p) => ubahFilter('page', String(p))}
            />
          </>
        )}
      </div>

      {/* Form tambah/edit */}
      <Modal
        buka={Boolean(form)}
        onTutup={() => setForm(null)}
        judul={form?.id ? 'Edit Barang' : 'Tambah Barang'}
        subjudul={form?.id ? 'SKU tidak bisa diubah.' : 'SKU dibuat otomatis sesuai kategori.'}
        footer={
          <>
            <button type="button" className="btn-sekunder" onClick={() => setForm(null)}>
              Batal
            </button>
            <button type="submit" form="form-barang" className="btn-utama" disabled={sedangSimpan}>
              {sedangSimpan ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        }
      >
        {form && (
          <form id="form-barang" onSubmit={simpan} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="nama">
                Nama barang *
              </label>
              <input
                id="nama"
                className="input"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="kategori">
                Kategori *
              </label>
              <select
                id="kategori"
                className="input"
                value={form.kategoriId}
                onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}
                required
              >
                <option value="">Pilih kategori</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ikon} {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="satuan">
                Satuan *
              </label>
              <input
                id="satuan"
                className="input"
                value={form.satuan}
                onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                placeholder="pcs / kg / dus / liter"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="stokMin">
                Stok minimum
              </label>
              <input
                id="stokMin"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.stokMin}
                onChange={(e) => setForm({ ...form, stokMin: e.target.value })}
              />
              <p className="mt-1 text-xs text-inkl">Di bawah angka ini, status jadi menipis.</p>
            </div>
            <div>
              <label className="label" htmlFor="hargaBeli">
                Harga beli (Rp)
              </label>
              <input
                id="hargaBeli"
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.hargaBeli}
                onChange={(e) => setForm({ ...form, hargaBeli: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="lokasiRak">
                Lokasi rak
              </label>
              <input
                id="lokasiRak"
                className="input"
                value={form.lokasiRak}
                onChange={(e) => setForm({ ...form, lokasiRak: e.target.value })}
                placeholder="misal A-1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-laut focus:ring-laut"
                  checked={form.aktif}
                  onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                />
                Barang aktif
              </label>
            </div>
          </form>
        )}
      </Modal>

      <Konfirmasi
        buka={Boolean(hapus)}
        onTutup={() => setHapus(null)}
        onYa={konfirmasiHapus}
        judul="Hapus barang ini?"
        pesan={
          hapus
            ? `"${hapus.nama}" akan dihapus permanen. Barang yang sudah punya riwayat transaksi nggak bisa dihapus, nonaktifkan saja.`
            : ''
        }
        labelYa="Ya, hapus"
        bahaya
        sedangProses={sedangHapus}
      />
    </div>
  );
}
