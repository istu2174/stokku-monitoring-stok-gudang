import { useEffect, useRef, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { angka } from '../lib/format.js';
import { BadgeStok } from './Ui.jsx';

/**
 * Pencarian barang dengan dropdown hasil.
 * Dipakai di form barang masuk, keluar, dan opname.
 */
export default function PemilihBarang({ onPilih, placeholder = 'Cari nama atau SKU barang…' }) {
  const [kata, setKata] = useState('');
  const [hasil, setHasil] = useState([]);
  const [buka, setBuka] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const kotak = useRef(null);

  useEffect(() => {
    const onKlik = (e) => {
      if (kotak.current && !kotak.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener('mousedown', onKlik);
    return () => document.removeEventListener('mousedown', onKlik);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setMemuat(true);
      try {
        const data = await api.get(`/barang${qs({ q: kata, limit: 15, aktif: 'true' })}`);
        setHasil(data.items);
      } catch {
        setHasil([]);
      } finally {
        setMemuat(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [kata]);

  function pilih(barang) {
    onPilih(barang);
    setKata('');
    setBuka(false);
  }

  return (
    <div className="relative" ref={kotak}>
      <input
        className="input"
        value={kata}
        placeholder={placeholder}
        onFocus={() => setBuka(true)}
        onChange={(e) => {
          setKata(e.target.value);
          setBuka(true);
        }}
      />
      {buka && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-naik">
          {memuat && <p className="px-3 py-3 text-sm text-inkl">Mencari…</p>}
          {!memuat && hasil.length === 0 && (
            <p className="px-3 py-3 text-sm text-inkl">Barang tidak ditemukan.</p>
          )}
          {hasil.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => pilih(b)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-lauts/60"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{b.nama}</span>
                <span className="block text-xs text-inkl">
                  {b.sku} · stok {angka(b.stok)} {b.satuan} · {b.kategori?.ikon} {b.kategori?.nama}
                </span>
              </span>
              <BadgeStok status={b.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
