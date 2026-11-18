import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let idBerikut = 1;

/** Notifikasi ringkas di pojok atas (auto hilang 4 detik). */
export function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([]);

  const tutup = useCallback((id) => {
    setDaftar((lama) => lama.filter((t) => t.id !== id));
  }, []);

  const tampil = useCallback(
    (pesan, jenis = 'sukses') => {
      const id = idBerikut++;
      setDaftar((lama) => [...lama, { id, pesan, jenis }]);
      setTimeout(() => tutup(id), 4000);
    },
    [tutup],
  );

  const toast = {
    sukses: (pesan) => tampil(pesan, 'sukses'),
    gagal: (pesan) => tampil(pesan, 'gagal'),
    info: (pesan) => tampil(pesan, 'info'),
  };

  const warna = {
    sukses: 'bg-white text-ink ring-amans',
    gagal: 'bg-white text-ink ring-habiss',
    info: 'bg-white text-ink ring-birus',
  };
  const ikon = { sukses: '✅', gagal: '⚠️', info: 'ℹ️' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 sm:items-end">
        {daftar.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-naik ring-1 ${warna[t.jenis]} animate-muncul`}
          >
            <span aria-hidden>{ikon[t.jenis]}</span>
            <span className="flex-1">{t.pesan}</span>
            <button
              type="button"
              onClick={() => tutup(t.id)}
              className="text-inkl transition hover:text-ink"
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}
