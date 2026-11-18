import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import {
  detailUntukCetak,
  laporanExpired,
  laporanMenipis,
  laporanMutasi,
  laporanNilai,
  laporanStok,
} from '../controllers/laporanController.js';

const router = Router();

// Hanya role yang punya izin lihat laporan (bukan Staf Gudang)
router.use(auth, requireIzin('lihatLaporan'));

router.get('/stok', laporanStok);
router.get('/menipis', laporanMenipis);
router.get('/nilai', laporanNilai);
router.get('/mutasi', laporanMutasi);
router.get('/expired', laporanExpired);
router.get('/transaksi/:id', detailUntukCetak);

export default router;
