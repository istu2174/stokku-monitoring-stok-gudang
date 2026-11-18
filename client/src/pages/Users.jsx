import { useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { tanggal } from '../lib/format.js';
import { EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';
import Modal from '../components/Modal.jsx';

const ROLE = [
  { nilai: 'ADMIN_SISTEM', label: 'Admin Sistem' },
  { nilai: 'MANAJER', label: 'Manajer Gudang' },
  { nilai: 'KEPALA', label: 'Kepala Gudang' },
  { nilai: 'ADMIN_INVENTORI', label: 'Admin Inventori' },
  { nilai: 'STAF', label: 'Staf Gudang' },
  { nilai: 'AUDITOR', label: 'Auditor / Viewer' },
];

const KOSONG = { nama: '', username: '', email: '', password: '', role: 'STAF', aktif: true };

export default function Users() {
  const { user: saya } = useAuth();
  const toast = useToast();

  const [filter, setFilter] = useState({ q: '', role: '', aktif: '' });
  const [items, setItems] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [form, setForm] = useState(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [reset, setReset] = useState(null);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [sedangReset, setSedangReset] = useState(false);

  async function muat() {
    setMemuat(true);
    try {
      const data = await api.get(`/users${qs({ ...filter, limit: 100 })}`);
      setItems(data.items);
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
  }, [filter]);

  async function simpan(e) {
    e.preventDefault();
    setSedangSimpan(true);
    try {
      if (form.id) {
        await api.put(`/users/${form.id}`, {
          nama: form.nama,
          username: form.username,
          email: form.email,
          role: form.role,
          aktif: form.aktif,
        });
        toast.sukses('User diperbarui.');
      } else {
        await api.post('/users', form);
        toast.sukses('User baru ditambahkan.');
      }
      setForm(null);
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangSimpan(false);
    }
  }

  async function kirimReset() {
    if (passwordBaru.length < 6) {
      toast.gagal('Password baru minimal 6 karakter.');
      return;
    }
    setSedangReset(true);
    try {
      await api.put(`/users/${reset.id}/password`, { passwordBaru });
      toast.sukses(`Password ${reset.username} berhasil direset.`);
      setReset(null);
      setPasswordBaru('');
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangReset(false);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="User & Role"
        keterangan="Kelola akun karyawan dan jabatannya. Akun nonaktif tidak bisa login."
        aksi={
          <button type="button" className="btn-utama" onClick={() => setForm({ ...KOSONG })}>
            + Tambah User
          </button>
        }
      />

      <div className="kartu grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          className="input"
          placeholder="Cari nama, username, email…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
        <select className="input" value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })}>
          <option value="">Semua role</option>
          {ROLE.map((r) => (
            <option key={r.nilai} value={r.nilai}>
              {r.label}
            </option>
          ))}
        </select>
        <select className="input" value={filter.aktif} onChange={(e) => setFilter({ ...filter, aktif: e.target.value })}>
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      <div className="kartu overflow-hidden">
        {memuat ? (
          <KerangkaBaris jumlah={6} />
        ) : items.length === 0 ? (
          <EmptyState ikon="👥" judul="User tidak ditemukan" pesan="Coba ubah kata kunci atau filter role." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Username / Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <p className="font-medium">{u.nama}</p>
                        {u.id === saya?.id && <p className="text-xs text-laut">akun kamu</p>}
                      </td>
                      <td>
                        <p className="text-sm">{u.username}</p>
                        <p className="text-xs text-inkl">{u.email}</p>
                      </td>
                      <td>
                        <span className="rounded-full bg-lauts px-2.5 py-1 text-xs font-medium text-laut">
                          {u.labelRole}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.aktif ? 'bg-amans text-aman' : 'bg-slate-100 text-inkl'
                          }`}
                        >
                          {u.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="text-xs text-inkl">{tanggal(u.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="btn-sekunder btn-kecil"
                            onClick={() => setForm({ ...u, password: '' })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-sekunder btn-kecil"
                            onClick={() => {
                              setReset(u);
                              setPasswordBaru('');
                            }}
                          >
                            Reset password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((u) => (
                <li key={u.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{u.nama}</p>
                      <p className="text-xs text-inkl">{u.username} · {u.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        u.aktif ? 'bg-amans text-aman' : 'bg-slate-100 text-inkl'
                      }`}
                    >
                      {u.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-laut">{u.labelRole}</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-sekunder btn-kecil" onClick={() => setForm({ ...u, password: '' })}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-sekunder btn-kecil"
                      onClick={() => {
                        setReset(u);
                        setPasswordBaru('');
                      }}
                    >
                      Reset password
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Form tambah/edit user */}
      <Modal
        buka={Boolean(form)}
        onTutup={() => setForm(null)}
        judul={form?.id ? 'Edit User' : 'Tambah User'}
        lebar="max-w-xl"
        footer={
          <>
            <button type="button" className="btn-sekunder" onClick={() => setForm(null)}>
              Batal
            </button>
            <button type="submit" form="form-user" className="btn-utama" disabled={sedangSimpan}>
              {sedangSimpan ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        }
      >
        {form && (
          <form id="form-user" onSubmit={simpan} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="nama-user">
                Nama lengkap *
              </label>
              <input
                id="nama-user"
                className="input"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="username-user">
                Username *
              </label>
              <input
                id="username-user"
                className="input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="huruf kecil, tanpa spasi"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email-user">
                Email *
              </label>
              <input
                id="email-user"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="role-user">
                Role *
              </label>
              <select
                id="role-user"
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={form.id === saya?.id}
              >
                {ROLE.map((r) => (
                  <option key={r.nilai} value={r.nilai}>
                    {r.label}
                  </option>
                ))}
              </select>
              {form.id === saya?.id && (
                <p className="mt-1 text-xs text-inkl">Role akun sendiri tidak bisa diubah.</p>
              )}
            </div>
            {!form.id ? (
              <div>
                <label className="label" htmlFor="password-user">
                  Password awal *
                </label>
                <input
                  id="password-user"
                  type="text"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="minimal 6 karakter"
                  minLength={6}
                  required
                />
              </div>
            ) : (
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-laut focus:ring-laut"
                    checked={form.aktif}
                    disabled={form.id === saya?.id}
                    onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                  />
                  Akun aktif
                </label>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Reset password */}
      <Modal
        buka={Boolean(reset)}
        onTutup={() => setReset(null)}
        judul="Reset Password"
        subjudul={reset ? `Untuk akun ${reset.username}` : ''}
        lebar="max-w-md"
        footer={
          <>
            <button type="button" className="btn-sekunder" onClick={() => setReset(null)}>
              Batal
            </button>
            <button type="button" className="btn-utama" onClick={kirimReset} disabled={sedangReset}>
              {sedangReset ? 'Menyimpan…' : 'Reset password'}
            </button>
          </>
        }
      >
        <label className="label" htmlFor="password-baru">
          Password baru *
        </label>
        <input
          id="password-baru"
          type="text"
          className="input"
          value={passwordBaru}
          onChange={(e) => setPasswordBaru(e.target.value)}
          placeholder="minimal 6 karakter"
        />
        <p className="mt-2 text-xs text-inkl">
          Sampaikan password baru ke yang bersangkutan, lalu minta dia menggantinya di halaman Profil.
        </p>
      </Modal>
    </div>
  );
}
