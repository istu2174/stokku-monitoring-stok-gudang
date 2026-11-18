import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import {
  daftarKategori,
  hapusKategori,
  tambahKategori,
  ubahKategori,
} from '../controllers/kategoriController.js';

const router = Router();

router.use(auth);

router.get('/', requireIzin('lihatMaster'), daftarKategori);
router.post('/', requireIzin('kelolaKategori'), tambahKategori);
router.put('/:id', requireIzin('kelolaKategori'), ubahKategori);
router.delete('/:id', requireIzin('kelolaKategori'), hapusKategori);

export default router;
