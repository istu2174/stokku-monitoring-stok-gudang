import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Menu sidebar. `izin` = satu kunci izin, `izinSalahSatu` = cukup salah satu.
 * Menu otomatis disembunyikan kalau role tidak punya izinnya.
 */
const MENU = [
  {
    judul: 'Utama',
    items: [{ to: '/', label: 'Dashboard', ikon: '📊', izin: 'lihatDashboard', ujung: true }],
  },
  {
    judul: 'Inventori',
    items: [
      { to: '/barang', label: 'Barang', ikon: '📦', izin: 'lihatMaster' },
      { to: '/kategori', label: 'Kategori', ikon: '🏷️', izin: 'lihatMaster' },
      { to: '/supplier', label: 'Supplier', ikon: '🚚', izin: 'lihatMaster' },
    ],
  },
  {
    judul: 'Transaksi',
    items: [
      { to: '/masuk', label: 'Barang Masuk', ikon: '📥', izin: 'catatMasuk' },
      { to: '/keluar', label: 'Barang Keluar', ikon: '📤', izin: 'ajukanKeluar' },
      { to: '/opname', label: 'Stock Opname', ikon: '⚖️', izin: 'opnameInput' },
      {
        to: '/persetujuan',
        label: 'Persetujuan',
        ikon: '✅',
        izinSalahSatu: ['approveKeluar', 'opnameApprove'],
      },
      { to: '/riwayat', label: 'Riwayat', ikon: '🕘' },
    ],
  },
  {
    judul: 'Lainnya',
    items: [
      { to: '/laporan', label: 'Laporan', ikon: '📄', izin: 'lihatLaporan' },
      { to: '/audit', label: 'Audit Log', ikon: '🔐', izin: 'lihatAudit' },
      { to: '/users', label: 'User & Role', ikon: '👥', izin: 'kelolaUser' },
      { to: '/profil', label: 'Profil', ikon: '⚙️' },
    ],
  },
];

export default function Layout() {
  const { user, logout, boleh, bolehSalahSatu } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const lokasi = useLocation();
  const navigate = useNavigate();

  // Tutup drawer tiap pindah halaman
  useEffect(() => {
    setDrawer(false);
  }, [lokasi.pathname]);

  const punyaAkses = (item) =>
    (item.izin && boleh(item.izin)) ||
    (item.izinSalahSatu && bolehSalahSatu(...item.izinSalahSatu)) ||
    (!item.izin && !item.izinSalahSatu);

  const menu = MENU.map((grup) => ({ ...grup, items: grup.items.filter(punyaAkses) })).filter(
    (grup) => grup.items.length > 0,
  );

  const semuaMenu = menu.flatMap((g) => g.items);
  // Bottom nav mobile: maksimal 4 menu utama + profil
  const navBawah = [
    semuaMenu.find((m) => m.to === '/'),
    semuaMenu.find((m) => m.to === '/barang'),
    semuaMenu.find((m) => m.to === '/riwayat'),
    semuaMenu.find((m) => m.to === '/laporan') || semuaMenu.find((m) => m.to === '/persetujuan'),
    { to: '/profil', label: 'Profil', ikon: '⚙️' },
  ].filter(Boolean);

  async function keluar() {
    await logout();
    navigate('/login', { replace: true });
  }

  const kelasMenu = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-lauts text-laut' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
    }`;

  const daftarMenu = (
    <nav className="flex flex-col gap-5">
      {menu.map((grup) => (
        <div key={grup.judul}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {grup.judul}
          </p>
          <div className="flex flex-col gap-0.5">
            {grup.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.ujung} className={kelasMenu}>
                <span aria-hidden className="text-base">
                  {item.ikon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-krem">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-laut text-lg text-white">
            📦
          </span>
          <div>
            <p className="text-base font-bold leading-tight text-ink">StokKu</p>
            <p className="text-[11px] text-inkl">Monitoring Stok Gudang</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">{daftarMenu}</div>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{user?.nama}</p>
            <p className="text-xs text-inkl">{user?.labelRole}</p>
          </div>
          <button type="button" onClick={keluar} className="btn-sekunder w-full">
            Keluar
          </button>
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawer(false)}
          />
          <div className="relative flex h-full w-72 max-w-[85%] flex-col bg-white shadow-naik animate-muncul">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-laut text-white">📦</span>
                <p className="font-bold">StokKu</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="rounded-lg p-2 text-inkl hover:bg-slate-100"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">{daftarMenu}</div>
            <div className="border-t border-slate-100 p-3">
              <p className="mb-2 px-1 text-sm font-semibold">{user?.nama}</p>
              <button type="button" onClick={keluar} className="btn-sekunder w-full">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top bar mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-lg p-2 text-ink hover:bg-slate-100"
            aria-label="Buka menu"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              📦
            </span>
            <span className="font-bold">StokKu</span>
          </div>
          <span className="rounded-full bg-lauts px-2.5 py-1 text-[11px] font-semibold text-laut">
            {user?.labelRole}
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {navBawah.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.ujung}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                isActive ? 'text-laut' : 'text-slate-500'
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {item.ikon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
