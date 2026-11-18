import { Link } from 'react-router-dom';

export default function TidakDitemukan() {
  return (
    <div className="grid min-h-screen place-items-center bg-krem px-4">
      <div className="kartu max-w-md p-8 text-center">
        <span className="text-5xl" aria-hidden>
          🧭
        </span>
        <h1 className="mt-3 text-lg font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-inkl">
          Alamat yang kamu buka nggak ada di StokKu. Coba kembali ke dashboard.
        </p>
        <Link to="/" className="btn-utama mt-5">
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
