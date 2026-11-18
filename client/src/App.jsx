import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Memuat } from './components/Ui.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Barang from './pages/Barang.jsx';
import Kategori from './pages/Kategori.jsx';
import Supplier from './pages/Supplier.jsx';
import BarangMasuk from './pages/BarangMasuk.jsx';
import BarangKeluar from './pages/BarangKeluar.jsx';
import Opname from './pages/Opname.jsx';
import Persetujuan from './pages/Persetujuan.jsx';
import Riwayat from './pages/Riwayat.jsx';
import Laporan from './pages/Laporan.jsx';
import Audit from './pages/Audit.jsx';
import Users from './pages/Users.jsx';
import Profil from './pages/Profil.jsx';
import KartuStok from './pages/KartuStok.jsx';
import TidakDitemukan from './pages/TidakDitemukan.jsx';

/** Tampilan kalau role tidak punya izin untuk halaman ini. */
function TidakPunyaAkses() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="kartu max-w-md p-8 text-center">
        <span className="text-5xl" aria-hidden>
          🔒
        </span>
        <h2 className="mt-3 text-lg font-bold">Halaman ini bukan untuk role kamu</h2>
        <p className="mt-2 text-sm text-inkl">
          Hak akses diatur oleh Admin Sistem. Kalau kamu merasa harusnya bisa, hubungi Admin Sistem.
        </p>
      </div>
    </div>
  );
}

/** Bungkus halaman dengan cek izin (backend tetap mengecek ulang). */
function PenjagaIzin({ kunci, salahSatu, children }) {
  const { boleh, bolehSalahSatu } = useAuth();
  const lolos = (kunci && boleh(kunci)) || (salahSatu && bolehSalahSatu(...salahSatu));
  if (!kunci && !salahSatu) return children;
  return lolos ? children : <TidakPunyaAkses />;
}

/** Semua route di dalam ini wajib login. */
function WajibLogin() {
  const { user, memuat } = useAuth();
  const lokasi = useLocation();

  if (memuat) {
    return (
      <div className="grid min-h-screen place-items-center bg-krem">
        <Memuat teks="Menyiapkan StokKu…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ dari: lokasi.pathname }} replace />;
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<WajibLogin />}>
        <Route
          index
          element={
            <PenjagaIzin kunci="lihatDashboard">
              <Dashboard />
            </PenjagaIzin>
          }
        />
        <Route
          path="barang"
          element={
            <PenjagaIzin kunci="lihatMaster">
              <Barang />
            </PenjagaIzin>
          }
        />
        <Route
          path="barang/:id/kartu-stok"
          element={
            <PenjagaIzin kunci="lihatLaporan">
              <KartuStok />
            </PenjagaIzin>
          }
        />
        <Route
          path="kategori"
          element={
            <PenjagaIzin kunci="lihatMaster">
              <Kategori />
            </PenjagaIzin>
          }
        />
        <Route
          path="supplier"
          element={
            <PenjagaIzin kunci="lihatMaster">
              <Supplier />
            </PenjagaIzin>
          }
        />
        <Route
          path="masuk"
          element={
            <PenjagaIzin kunci="catatMasuk">
              <BarangMasuk />
            </PenjagaIzin>
          }
        />
        <Route
          path="keluar"
          element={
            <PenjagaIzin kunci="ajukanKeluar">
              <BarangKeluar />
            </PenjagaIzin>
          }
        />
        <Route
          path="opname"
          element={
            <PenjagaIzin kunci="opnameInput">
              <Opname />
            </PenjagaIzin>
          }
        />
        <Route
          path="persetujuan"
          element={
            <PenjagaIzin salahSatu={['approveKeluar', 'opnameApprove']}>
              <Persetujuan />
            </PenjagaIzin>
          }
        />
        <Route path="riwayat" element={<Riwayat />} />
        <Route
          path="laporan"
          element={
            <PenjagaIzin kunci="lihatLaporan">
              <Laporan />
            </PenjagaIzin>
          }
        />
        <Route
          path="audit"
          element={
            <PenjagaIzin kunci="lihatAudit">
              <Audit />
            </PenjagaIzin>
          }
        />
        <Route
          path="users"
          element={
            <PenjagaIzin kunci="kelolaUser">
              <Users />
            </PenjagaIzin>
          }
        />
        <Route path="profil" element={<Profil />} />
      </Route>

      <Route path="*" element={<TidakDitemukan />} />
    </Routes>
  );
}
