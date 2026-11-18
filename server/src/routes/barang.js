import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import {
  daftarBarang,
  detailBarang,
  hapusBarang,
  tambahBarang,
  ubahBarang,
} from '../controllers/barangController.js';
import { kartuStok } from '../controllers/kartuStokController.js';

const router = Router();

router.use(auth);

router.get('/', requireIzin('lihatMaster'), daftarBarang);
router.get('/:id', requireIzin('lihatMaster'), detailBarang);
router.get('/:id/kartu-stok', requireIzin('lihatLaporan'), kartuStok);

router.post('/', requireIzin('kelolaBarang'), tambahBarang);
router.put('/:id', requireIzin('kelolaBarang'), ubahBarang);
router.delete('/:id', requireIzin('kelolaBarang'), hapusBarang);

export default router;
