import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Menyiapkan database saat server pertama kali dijalankan di hosting.
 * - Membuat tabel dari migrasi kalau belum ada.
 * - Mengisi data contoh kalau tabel user masih kosong.
 */
const prisma = new PrismaClient();

function jalankan(perintah, argumen) {
  const hasil = spawnSync(perintah, argumen, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (hasil.status !== 0) process.exit(hasil.status ?? 1);
}

jalankan('npx', ['prisma', 'migrate', 'deploy']);

let jumlahUser = 0;
try {
  jumlahUser = await prisma.user.count();
} catch (err) {
  console.error('Gagal membaca tabel user:', err.message);
  process.exit(1);
}

if (jumlahUser === 0) {
  console.log('Database masih kosong, mengisi data contoh...');
  jalankan('node', ['prisma/seed.js']);
} else {
  console.log(`Database siap (${jumlahUser} user).`);
}

await prisma.$disconnect();
