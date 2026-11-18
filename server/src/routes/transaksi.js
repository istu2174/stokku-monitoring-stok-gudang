import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import {
  approveTransaksi,
  buatKeluar,
  buatMasuk,
  buatOpname,
  daftarMenunggu,
  daftarTransaksi,
  detailTransaksi,
  tolakTransaksi,
} from '../controllers/transaksiController.js';

const router = Router();

router.use(auth);

// Semua role yang login boleh melihat riwayat transaksi
router.get('/', daftarTransaksi);
router.get('/menunggu', daftarMenunggu);
router.get('/:id', detailTransaksi);

// Pencatatan
router.post('/masuk', requireIzin('catatMasuk'), buatMasuk);
router.post('/keluar', requireIzin('ajukanKeluar'), buatKeluar);
router.post('/opname', requireIzin('opnameInput'), buatOpname);

// Persetujuan: role dicek lagi di controller sesuai tipe transaksi
router.put('/:id/approve', approveTransaksi);
router.put('/:id/tolak', tolakTransaksi);

export default router;
