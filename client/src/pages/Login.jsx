import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Akun demo dari seed — memudahkan uji coba tiap role. */
const AKUN_DEMO = [
  { role: 'Admin Sistem', username: 'admin', password: 'admin123' },
  { role: 'Manajer Gudang', username: 'manajer', password: 'manajer123' },
  { role: 'Kepala Gudang', username: 'kepala', password: 'kepala123' },
  { role: 'Admin Inventori', username: 'inventori', password: 'inventori123' },
  { role: 'Staf Gudang', username: 'staf', password: 'staf123' },
  { role: 'Auditor', username: 'auditor', password: 'auditor123' },
];

export default function Login() {
  const { user, memuat, login } = useAuth();
  const navigate = useNavigate();
  const lokasi = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [galat, setGalat] = useState('');
  const [sedangKirim, setSedangKirim] = useState(false);
  const [bukaDemo, setBukaDemo] = useState(false);

  if (!memuat && user) {
    const tujuan = lokasi.state?.dari || '/';
    return <Navigate to={tujuan} replace />;
  }

  async function kirim(e) {
    e.preventDefault();
    setGalat('');
    setSedangKirim(true);
    try {
      await login(username.trim(), password);
      navigate(lokasi.state?.dari || '/', { replace: true });
    } catch (err) {
      setGalat(err.message || 'Gagal masuk.');
    } finally {
      setSedangKirim(false);
    }
  }

  function pakaiDemo(akun) {
    setUsername(akun.username);
    setPassword(akun.password);
    setGalat('');
  }

  return (
    <div className="flex min-h-screen flex-col bg-krem lg:flex-row">
      {/* Panel brand */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-laut px-6 py-8 text-white lg:w-[45%] lg:px-12 lg:py-14">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-xl">📦</span>
          <div>
            <p className="text-lg font-bold leading-tight">StokKu</p>
            <p className="text-xs text-white/70">Monitoring Stok Gudang</p>
          </div>
        </div>

        <div className="mt-8 lg:mt-0">
          <h1 className="max-w-md text-2xl font-bold leading-snug lg:text-4xl">
            Stok gudang rapi, keputusan cepat.
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80 lg:text-base">
            Catat barang masuk dan keluar, pantau stok menipis dan barang kedaluwarsa, semuanya
            dengan persetujuan sesuai jabatan.
          </p>

          <ul className="mt-6 grid gap-2.5 text-sm text-white/85">
            {[
              'Stok per batch dengan FEFO otomatis',
              'Approval barang keluar & stock opname',
              'Peringatan stok menipis dan expired',
              'Laporan siap ekspor Excel & CSV',
            ].map((teks) => (
              <li key={teks} className="flex items-start gap-2">
                <span aria-hidden>✓</span>
                {teks}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 hidden text-xs text-white/60 lg:block">
          Enam jabatan, satu gudang: Admin Sistem, Manajer, Kepala, Admin Inventori, Staf, Auditor.
        </p>
      </div>

      {/* Form login */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">Masuk ke akun kamu</h2>
          <p className="mt-1 text-sm text-inkl">Pakai username atau email yang diberikan Admin Sistem.</p>

          <form onSubmit={kirim} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="username">
                Username atau email
              </label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: staf"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {galat && (
              <p className="rounded-xl bg-habiss px-3 py-2 text-sm font-medium text-habis">{galat}</p>
            )}

            <button type="submit" className="btn-utama w-full py-3" disabled={sedangKirim}>
              {sedangKirim ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setBukaDemo((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ink"
            >
              Akun demo (dari seed)
              <span aria-hidden>{bukaDemo ? '▲' : '▼'}</span>
            </button>
            {bukaDemo && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {AKUN_DEMO.map((akun) => (
                  <li key={akun.username}>
                    <button
                      type="button"
                      onClick={() => pakaiDemo(akun)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        <span className="font-medium">{akun.username}</span>
                        <span className="text-inkl"> / {akun.password}</span>
                      </span>
                      <span className="text-xs text-laut">{akun.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
