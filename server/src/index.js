import { buatApp } from './app.js';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';

const app = buatApp();

const server = app.listen(config.port, () => {
  console.log(`📦 StokKu server jalan di http://localhost:${config.port}`);
});

/** Tutup koneksi DB dengan rapi saat proses dihentikan. */
async function matikan(signal) {
  console.log(`\n[stokku] menerima ${signal}, menutup server…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => matikan('SIGINT'));
process.on('SIGTERM', () => matikan('SIGTERM'));
