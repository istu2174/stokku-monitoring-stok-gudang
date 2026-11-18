import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { gayaKategori } from '../lib/format.js';
import { EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';
import Modal from '../components/Modal.jsx';
import Konfirmasi from '../components/Konfirmasi.jsx';

const WARNA_PILIHAN = [
  '#F59E0B', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
  '#22C55E', '#EF4444', '#F97316', '#64748B',
];

const IKON_PILIHAN = ['🍚', '🥤', '💻', '📎', '🧴', '🏠', '👕', '🧱', '🔧', '📦', '🛒', '🧪'];

export default function Kategori() {
  const { boleh } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [form, setForm] = useState(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);

  const [hapus, setHapus] = useState(null); // kategori yang mau dihapus
  const [pindahKe, setPindahKe] = useState('');
  const [butuhPindah, setButuhPindah] = useState(false);
  const [sedangHapus, setSedangHapus] = useState(false);

  const bisaKelola = boleh('kelolaKategori');

  async function muat() {
    setMemuat(true);
    try {
      const data = await api.get('/kategori');
      setItems(data.items);
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function simpan(e) {
    e.preventDefault();
    setSedangSimpan(true);
    try {
      const isi = { nama: form.nama, ikon: form.ikon, warna: form.warna };
      if (form.id) {
        await api.put(`/kategori/${form.id}`, isi);
        toast.sukses('Kategori diperbarui.');
      } else {
        await api.post('/kategori', isi);
        toast.sukses('Kategori ditambahkan.');
      }
      setForm(null);
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangSimpan(false);
    }
  }

  async function cobaHapus() {
    setSedangHapus(true);
    try {
      const hasil = await api.del(
        `/kategori/${hapus.id}${pindahKe ? `?pindahKe=${encodeURIComponent(pindahKe)}` : ''}`,
      );
      toast.sukses(
        hasil.dipindahkan > 0
          ? `Kategori dihapus, ${hasil.dipindahkan} barang dipindahkan.`
          : 'Kategori dihapus.',
      );
      setHapus(null);
      setPindahKe('');
      setButuhPindah(false);
      muat();
    } catch (err) {
      if (err.data?.kode === 'KATEGORI_DIPAKAI') {
        setButuhPindah(true);
      } else {
        toast.gagal(err.message);
      }
    } finally {
      setSedangHapus(false);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Kategori Barang"
        keterangan="Nama kategori harus unik. Kategori yang masih dipakai nggak bisa dihapus langsung."
        aksi={
          bisaKelola && (
            <button
              type="button"
              className="btn-utama"
              onClick={() => setForm({ nama: '', ikon: '📦', warna: '#0EA5A4' })}
            >
              + Tambah Kategori
            </button>
          )
        }
      />

      {memuat ? (
        <div className="kartu">
          <KerangkaBaris jumlah={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="kartu">
          <EmptyState ikon="🏷️" judul="Belum ada kategori" pesan="Tambahkan kategori untuk mulai mengelompokkan barang." />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((k) => (
            <div key={k.id} className="kartu flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                    style={gayaKategori(k.warna)}
                  >
                    {k.ikon}
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">{k.nama}</p>
                    <p className="text-xs text-inkl">{k.jumlahBarang} barang</p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={gayaKategori(k.warna)}
                >
                  {k.warna}
                </span>
              </div>

              {bisaKelola && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-sekunder btn-kecil flex-1"
                    onClick={() => setForm({ id: k.id, nama: k.nama, ikon: k.ikon, warna: k.warna })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-kecil flex-1 rounded-xl text-habis ring-1 ring-habis/30 hover:bg-habiss"
                    onClick={() => {
                      setHapus(k);
                      setPindahKe('');
                      setButuhPindah(false);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form kategori */}
      <Modal
        buka={Boolean(form)}
        onTutup={() => setForm(null)}
        judul={form?.id ? 'Edit Kategori' : 'Tambah Kategori'}
        lebar="max-w-lg"
        footer={
          <>
            <button type="button" className="btn-sekunder" onClick={() => setForm(null)}>
              Batal
            </button>
            <button type="submit" form="form-kategori" className="btn-utama" disabled={sedangSimpan}>
              {sedangSimpan ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        }
      >
        {form && (
          <form id="form-kategori" onSubmit={simpan} className="space-y-4">
            <div>
              <label className="label" htmlFor="nama-kategori">
                Nama kategori *
              </label>
              <input
                id="nama-kategori"
                className="input"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>

            <div>
              <p className="label">Ikon</p>
              <div className="flex flex-wrap gap-2">
                {IKON_PILIHAN.map((ikon) => (
                  <button
                    key={ikon}
                    type="button"
                    onClick={() => setForm({ ...form, ikon })}
                    className={`grid h-10 w-10 place-items-center rounded-xl text-lg ring-1 transition ${
                      form.ikon === ikon ? 'bg-lauts ring-laut' : 'bg-white ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ikon}
                  </button>
                ))}
                <input
                  className="input h-10 w-20 text-center"
                  value={form.ikon}
                  onChange={(e) => setForm({ ...form, ikon: e.target.value })}
                  maxLength={4}
                  aria-label="Ikon lain"
                />
              </div>
            </div>

            <div>
              <p className="label">Warna</p>
              <div className="flex flex-wrap items-center gap-2">
                {WARNA_PILIHAN.map((warna) => (
                  <button
                    key={warna}
                    type="button"
                    onClick={() => setForm({ ...form, warna })}
                    className={`h-8 w-8 rounded-full transition ${
                      form.warna.toUpperCase() === warna ? 'ring-2 ring-offset-2 ring-ink' : ''
                    }`}
                    style={{ backgroundColor: warna }}
                    aria-label={`Warna ${warna}`}
                  />
                ))}
                <input
                  type="color"
                  value={form.warna}
                  onChange={(e) => setForm({ ...form, warna: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-200"
                  aria-label="Warna lain"
                />
              </div>
            </div>

            <div
              className="rounded-xl border px-3 py-2 text-sm"
              style={gayaKategori(form.warna)}
            >
              Pratinjau: {form.ikon} {form.nama || 'Nama kategori'}
            </div>
          </form>
        )}
      </Modal>

      {/* Konfirmasi hapus + pindahkan barang */}
      <Konfirmasi
        buka={Boolean(hapus) && !butuhPindah}
        onTutup={() => {
          setHapus(null);
          setButuhPindah(false);
          setPindahKe('');
        }}
        onYa={cobaHapus}
        judul={butuhPindah ? 'Kategori masih dipakai barang' : 'Hapus kategori ini?'}
        pesan={
          butuhPindah
            ? `Kategori "${hapus?.nama}" masih dipakai barang. Pilih kategori tujuan untuk memindahkan barangnya, lalu hapus.`
            : `Kategori "${hapus?.nama}" akan dihapus. Kalau masih dipakai barang, kamu akan diminta memindahkannya dulu.`
        }
        labelYa={butuhPindah ? 'Pindahkan & hapus' : 'Ya, hapus'}
        bahaya
        sedangProses={sedangHapus}
      />

      {butuhPindah && hapus && (
        <Modal
          buka
          onTutup={() => {
            setButuhPindah(false);
            setPindahKe('');
          }}
          judul="Pindahkan barang ke kategori lain"
          subjudul={`Barang dari "${hapus.nama}" akan dipindahkan ke kategori yang kamu pilih.`}
          lebar="max-w-md"
          footer={
            <>
              <button type="button" className="btn-sekunder" onClick={() => setButuhPindah(false)}>
                Batal
              </button>
              <button
                type="button"
                className="btn-utama"
                disabled={!pindahKe || sedangHapus}
                onClick={() => {
                  setButuhPindah(false);
                  cobaHapus();
                }}
              >
                Pindahkan & hapus
              </button>
            </>
          }
        >
          <select className="input" value={pindahKe} onChange={(e) => setPindahKe(e.target.value)}>
            <option value="">Pilih kategori tujuan</option>
            {items
              .filter((k) => k.id !== hapus.id)
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ikon} {k.nama}
                </option>
              ))}
          </select>
        </Modal>
      )}
    </div>
  );
}
