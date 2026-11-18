/** Error dengan status HTTP; pesannya sudah berbahasa Indonesia. */
export class AppError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

export const badRequest = (pesan) => new AppError(400, pesan);
export const unauthorized = (pesan = 'Kamu harus login dulu.') => new AppError(401, pesan);
export const forbidden = (pesan = 'Kamu nggak punya akses ke fitur ini.') =>
  new AppError(403, pesan);
export const notFound = (pesan = 'Data tidak ditemukan.') => new AppError(404, pesan);
export const conflict = (pesan, extra) => new AppError(409, pesan, extra);
