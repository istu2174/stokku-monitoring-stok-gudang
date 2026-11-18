import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { angka, rupiah, rupiahRingkas, tanggal, TIPE_TRANSAKSI } from '../lib/format.js';
import { BadgeStok, BadgeTransaksi, EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';

const WARNA_PIE = ['#0F766E', '#2563EB', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#EA580C', '#4F46E5', '#0D9488'];

function Kartu({ label, nilai, ikon, warna = 'text-ink', catatan, ke }) {
  const isi = (
    <div className="kartu flex h-full flex-col justify-between p-4 transition hover:shadow-naik">
      <div className="flex items-start justify-between gap-2">
        <p className="min-h-[32px] text-xs font-medium uppercase leading-4 tracking-wide text-inkl">
          {label}
        </p>
        <span className="text-lg" aria-hidden>
          {ikon}
        </span>
      </div>
      <p className={`mt-3 text-2xl font-bold leading-none ${warna}`}>{nilai}</p>
      <p className="mt-1.5 min-h-[16px] text-xs text-inkl">{catatan}</p>
    </div>
  );
  return ke ? <Link to={ke}>{isi}</Link> : isi;
}

export default function Dashboard() {
  const { user, boleh } = useAuth();
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    let aktif = true;
    api
      .get('/dashboard')
      .then((d) => aktif && setData(d))
      .catch((e) => aktif && setGalat(e.message))
      .finally(() => aktif && setMemuat(false));
    return () => {
      aktif = false;
    };
  }, []);

  if (memuat) {
    return (
      <div className="kartu">
        <KerangkaBaris jumlah={6} />
      </div>
    );
  }
  if (galat) {
    return <div className="kartu p-6 text-sm text-habis">{galat}</div>;
  }

  const { ringkas, menipis, akanExpired, aktivitas, distribusiKategori, tren } = data;
  const jam = new Date().getHours();
  const sapaan = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 19 ? 'Selamat sore' : 'Selamat malam';

  return (
    <div className="space-y-5">
      <JudulHalaman
        judul={`${sapaan}, ${user?.nama?.split(' ')[0] || 'kawan'}`}
        keterangan={
          boleh('lihatLaporan')
            ? 'Ringkasan kondisi gudang hari ini.'
            : 'Ringkasan ringkas untuk tim lapangan.'
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kartu label="Total Barang" nilai={ringkas.totalBarang} ikon="📦" ke="/barang" />
        <Kartu
          label="Stok Menipis"
          nilai={ringkas.stokMenipis}
          ikon="⚠️"
          warna={ringkas.stokMenipis > 0 ? 'text-menipis' : 'text-ink'}
          ke="/barang?status=MENIPIS"
        />
        <Kartu
          label="Stok Habis"
          nilai={ringkas.stokHabis}
          ikon="🚫"
          warna={ringkas.stokHabis > 0 ? 'text-habis' : 'text-ink'}
          ke="/barang?status=HABIS"
        />
        <Kartu
          label="Expired ≤30 Hari"
          nilai={ringkas.akanExpired}
          ikon="⏳"
          catatan={`${ringkas.sudahExpired} sudah lewat`}
          warna={ringkas.akanExpired > 0 ? 'text-menipis' : 'text-ink'}
        />
        <Kartu
          label="Menunggu Approval"
          nilai={ringkas.menungguApproval}
          ikon="✅"
          catatan="Pengajuan keluar & opname"
          ke="/persetujuan"
        />
        {ringkas.nilaiPersediaan !== undefined && (
          <Kartu
            label="Nilai Persediaan"
            nilai={rupiahRingkas(ringkas.nilaiPersediaan)}
            ikon="💰"
            catatan={rupiah(ringkas.nilaiPersediaan)}
          />
        )}
      </div>

      {/* Grafik */}
      <div className="grid gap-4 xl:grid-cols-5">
        {tren && (
          <div className="kartu p-4 xl:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Nilai Pergerakan 14 Hari</h2>
                <p className="text-xs text-inkl">Nilai barang masuk dan keluar per hari (Rp)</p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tren} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="tanggal"
                    tickFormatter={(v) => v.slice(8)}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={48}
                    domain={[0, (dataMax) => Math.ceil((dataMax * 1.15) / 500000) * 500000]}
                    tickFormatter={(v) =>
                      v >= 1_000_000 ? `${Math.round(v / 100_000) / 10} jt` : v >= 1000 ? `${Math.round(v / 1000)} rb` : v
                    }
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    labelFormatter={(v) => tanggal(v)}
                    formatter={(nilai, nama) => [rupiah(nilai), nama === 'masuk' ? 'Masuk' : 'Keluar']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                  />
                  <Legend formatter={(v) => (v === 'masuk' ? 'Masuk' : 'Keluar')} iconType="circle" />
                  <Bar dataKey="masuk" fill="#0F766E" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                  <Bar dataKey="keluar" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={`kartu p-4 ${tren ? 'xl:col-span-2' : 'xl:col-span-5'}`}>
          <h2 className="font-semibold">Barang per Kategori</h2>
          <p className="text-xs text-inkl">Jumlah item aktif di tiap kategori</p>
          <div className="relative mt-1 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribusiKategori}
                  dataKey="jumlahBarang"
                  nameKey="kategori"
                  innerRadius={44}
                  outerRadius={70}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {distribusiKategori.map((entry, i) => (
                    <Cell key={entry.kategori} fill={WARNA_PIE[i % WARNA_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`${v} barang`, n]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-xl font-bold leading-none">{ringkas.totalBarang}</p>
                <p className="text-[10px] text-inkl">barang</p>
              </div>
            </div>
          </div>
          <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1">
            {[...distribusiKategori]
              .sort((a, b) => b.jumlahBarang - a.jumlahBarang)
              .map((k) => {
                const index = distribusiKategori.findIndex((d) => d.kategori === k.kategori);
                // Nama panjang dipendekkan supaya tidak terpotong di legenda
                const namaPendek = k.kategori.includes('&')
                  ? k.kategori.split('&')[0].trim()
                  : k.kategori;
                return (
                  <li key={k.kategori} className="flex items-center gap-2 text-[11px] leading-4">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: WARNA_PIE[index % WARNA_PIE.length] }}
                    />
                    <span className="truncate text-inkl" title={k.kategori}>
                      {namaPendek}
                    </span>
                    <span className="ml-auto font-semibold">{k.jumlahBarang}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* Daftar peringatan & aktivitas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="kartu overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Stok Menipis & Habis</h2>
            <Link to="/barang?status=MENIPIS" className="text-xs font-semibold text-laut">
              Lihat semua
            </Link>
          </div>
          {menipis.length === 0 ? (
            <EmptyState ikon="👍" judul="Semua stok aman" pesan="Belum ada barang yang perlu dipesan ulang." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {menipis.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.nama}</p>
                    <p className="text-xs text-inkl">
                      {b.sku} · min {angka(b.stokMin)} {b.satuan}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">
                      {angka(b.stok)} {b.satuan}
                    </span>
                    <BadgeStok status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="kartu overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold">Expired Terdekat</h2>
            <Link to="/laporan" className="text-xs font-semibold text-laut">
              Laporan
            </Link>
          </div>
          {akanExpired.length === 0 ? (
            <EmptyState ikon="🗓️" judul="Tidak ada yang mendesak" pesan="Belum ada batch yang kedaluwarsa dalam 30 hari." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {akanExpired.map((b, i) => (
                <li key={`${b.id}-${b.batchNo}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.nama}</p>
                    <p className="text-xs text-inkl">
                      Batch {b.batchNo} · {angka(b.qtyBatch)} {b.satuan}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      b.sisaHari < 0
                        ? 'bg-habis text-white'
                        : b.sisaHari <= 7
                          ? 'bg-menipis text-white'
                          : 'bg-menipiss text-menipis'
                    }`}
                  >
                    {b.sisaHari < 0 ? `Lewat ${Math.abs(b.sisaHari)} hari` : `${b.sisaHari} hari lagi`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="kartu overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold">Aktivitas Terbaru</h2>
          <Link to="/riwayat" className="text-xs font-semibold text-laut">
            Riwayat lengkap
          </Link>
        </div>
        {aktivitas.length === 0 ? (
          <EmptyState
            ikon="🧾"
            judul="Belum ada transaksi"
            pesan="Transaksi barang masuk dan keluar akan muncul di sini."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {aktivitas.map((t) => {
              const meta = TIPE_TRANSAKSI[t.tipe] || TIPE_TRANSAKSI.MASUK;
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base ${meta.kelas}`}>
                      {meta.ikon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {meta.label} · {t.noDokumen || '-'}
                      </p>
                      <p className="truncate text-xs text-inkl">
                        {tanggal(t.tanggal)} · {t.oleh} · {t.ringkasItem || `${t.jumlahItem} barang`}
                      </p>
                    </div>
                  </div>
                  <BadgeTransaksi status={t.status} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
