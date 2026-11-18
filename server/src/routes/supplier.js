import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import {
  daftarSupplier,
  hapusSupplier,
  tambahSupplier,
  ubahSupplier,
} from '../controllers/supplierController.js';

const router = Router();

router.use(auth);

router.get('/', requireIzin('lihatMaster'), daftarSupplier);
router.post('/', requireIzin('kelolaSupplier'), tambahSupplier);
router.put('/:id', requireIzin('kelolaSupplier'), ubahSupplier);
router.delete('/:id', requireIzin('kelolaSupplier'), hapusSupplier);

export default router;
