import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { JudulHalaman } from '../components/Ui.jsx';

/** Profil sendiri: lihat data akun dan ganti password. */
export default function Profil() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [ulangi, setUlangi] = useState('');
  const [sedangSimpan, setSedangSimpan] = useState(false);

  async function gantiPassword(e) {
    e.preventDefault();
    if (passwordBaru !== ulangi) {
      toast.gagal('Password baru dan ulangannya belum sama.');
      return;
    }
    setSedangSimpan(true);
    try {
      await api.put('/auth/password', { passwordLama, passwordBaru });
      toast.sukses('Password berhasil diganti.');
      setPasswordLama('');
      setPasswordBaru('');
      setUlangi('');
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangSimpan(false);
    }
  }

  async function keluar() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="space-y-4">
      <JudulHalaman judul="Profil" keterangan="Data akun kamu dan pengaturan password." />

      <div className="kartu p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lauts text-2xl">👤</span>
          <div className="min-w-0">
            <p className="text-lg font-bold">{user?.nama}</p>
            <p className="text-sm text-inkl">
              {user?.username} · {user?.email}
            </p>
            <span className="mt-1 inline-flex rounded-full bg-laut px-2.5 py-1 text-xs font-semibold text-white">
              {user?.labelRole}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={gantiPassword} className="kartu space-y-4 p-5">
          <div>
            <h2 className="font-semibold">Ganti Password</h2>
            <p className="text-xs text-inkl">Minimal 6 karakter, dan harus beda dari password lama.</p>
          </div>

          <div>
            <label className="label" htmlFor="password-lama">
              Password lama *
            </label>
            <input
              id="password-lama"
              type="password"
              className="input"
              autoComplete="current-password"
              value={passwordLama}
              onChange={(e) => setPasswordLama(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password-baru">
              Password baru *
            </label>
            <input
              id="password-baru"
              type="password"
              className="input"
              autoComplete="new-password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="ulangi">
              Ulangi password baru *
            </label>
            <input
              id="ulangi"
              type="password"
              className="input"
              autoComplete="new-password"
              value={ulangi}
              onChange={(e) => setUlangi(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn-utama w-full" disabled={sedangSimpan}>
            {sedangSimpan ? 'Menyimpan…' : 'Simpan Password Baru'}
          </button>
        </form>

        <div className="kartu space-y-3 p-5">
          <h2 className="font-semibold">Sesi</h2>
          <p className="text-sm text-inkl">
            Kamu sedang login di perangkat ini. Sesi berlaku 8 jam dan berakhir otomatis kalau akun
            dinonaktifkan Admin Sistem.
          </p>
          <button type="button" className="btn-sekunder w-full" onClick={keluar}>
            Keluar dari akun
          </button>
        </div>
      </div>
    </div>
  );
}
