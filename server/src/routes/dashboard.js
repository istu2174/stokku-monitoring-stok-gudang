import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import { auditTerbaru, ringkasanDashboard } from '../controllers/dashboardController.js';
import { daftarAudit } from '../controllers/auditController.js';

const router = Router();

router.use(auth);

router.get('/', requireIzin('lihatDashboard'), ringkasanDashboard);

export default router;

/** Router khusus audit log, dipasang terpisah di /api/audit */
export const routerAudit = Router();
routerAudit.use(auth, requireIzin('lihatAudit'));
routerAudit.get('/', daftarAudit);
routerAudit.get('/terbaru', auditTerbaru);
