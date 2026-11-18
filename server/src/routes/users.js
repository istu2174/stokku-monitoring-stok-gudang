import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import {
  daftarUser,
  resetPassword,
  tambahUser,
  ubahUser,
} from '../controllers/userController.js';

const router = Router();

// Semua endpoint user hanya untuk Admin Sistem
router.use(auth, requireIzin('kelolaUser'));

router.get('/', daftarUser);
router.post('/', tambahUser);
router.put('/:id', ubahUser);
router.put('/:id/password', resetPassword);

export default router;
