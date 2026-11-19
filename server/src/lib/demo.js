import { config } from '../config.js';
import { forbidden } from './errors.js';

/** Username akun contoh dari prisma/seed.js — dipakai bersama semua pengunjung demo. */
export const AKUN_DEMO = ['admin', 'manajer', 'kepala', 'inventori', 'staf', 'auditor'];

/** Tolak perubahan akun demo (password, role, status) saat mode demo aktif. */
export function jagaAkunDemo(username) {
  if (config.demo && AKUN_DEMO.includes(username)) {
    throw forbidden(
      'Akun demo dipakai bersama, jadi tidak bisa diubah. Buat user baru untuk mencoba fitur ini.',
    );
  }
}
