import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { gantiPassword, login, logout, me } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/logout', auth, logout);
router.get('/me', auth, me);
router.put('/password', auth, gantiPassword);

export default router;
