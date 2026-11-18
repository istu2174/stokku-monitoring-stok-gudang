import { useEffect } from 'react';

/** Modal dasar: overlay gelap, panel putih, tombol aksi di footer. */
export default function Modal({ buka, onTutup, judul, subjudul, children, footer, lebar = 'max-w-2xl' }) {
  useEffect(() => {
    if (!buka) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onTutup?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [buka, onTutup]);

  if (!buka) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 cursor-default"
        onClick={onTutup}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`relative z-10 flex max-h-[92vh] w-full ${lebar} flex-col overflow-hidden rounded-t-3xl bg-white shadow-naik animate-muncul sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink sm:text-lg">{judul}</h2>
            {subjudul && <p className="mt-0.5 text-sm text-inkl">{subjudul}</p>}
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="rounded-lg p-1.5 text-inkl transition hover:bg-slate-100 hover:text-ink"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
