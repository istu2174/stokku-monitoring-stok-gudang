/**
 * Pembungkus fetch ke API StokKu.
 * Semua request pakai credentials: 'include' supaya cookie httpOnly ikut.
 */
const BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function permintaan(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Nggak bisa menghubungi server. Cek koneksi ya.', 0);
  }

  const tipe = res.headers.get('content-type') || '';
  const data = tipe.includes('json') ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(
      (data && data.message) || `Permintaan gagal (${res.status}).`,
      res.status,
      data,
    );
  }
  return data;
}

/** Buat query string dari objek, lewati nilai kosong. */
export function qs(params) {
  const bersih = Object.entries(params || {}).filter(
    ([, nilai]) => nilai !== '' && nilai !== null && nilai !== undefined,
  );
  if (!bersih.length) return '';
  return `?${new URLSearchParams(bersih).toString()}`;
}

export const api = {
  get: (path) => permintaan(path),
  post: (path, body) => permintaan(path, { method: 'POST', body }),
  put: (path, body) => permintaan(path, { method: 'PUT', body }),
  del: (path) => permintaan(path, { method: 'DELETE' }),
};

/** Unduh file laporan (xlsx/csv) lalu simpan ke folder download. */
export async function unduhLaporan(path, namaDefault) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (!res.ok) {
    let pesan = 'Gagal mengunduh laporan.';
    try {
      const data = await res.json();
      if (data?.message) pesan = data.message;
    } catch {
      /* biarkan pesan bawaan */
    }
    throw new ApiError(pesan, res.status);
  }

  const disposisi = res.headers.get('content-disposition') || '';
  const cocok = disposisi.match(/filename="?([^";]+)"?/);
  const namaFile = cocok?.[1] || namaDefault;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = namaFile;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
