import { Router } from 'express';
import { auth, requireIzin } from '../middlewares/auth.js';
import { LABEL_ROLE, ROLE, SEMUA_ROLE } from '../lib/roles.js';
import routerAuth from './auth.js';
import routerUsers from './users.js';
import routerKategori from './kategori.js';
import routerSupplier from './supplier.js';
import routerBarang from './barang.js';
import routerTransaksi from './transaksi.js';
import routerLaporan from './laporan.js';
import routerDashboard, { routerAudit } from './dashboard.js';

const router = Router();

router.use('/auth', routerAuth);
router.use('/users', routerUsers);
router.use('/kategori', routerKategori);
router.use('/supplier', routerSupplier);
router.use('/barang', routerBarang);
router.use('/transaksi', routerTransaksi);
router.use('/laporan', routerLaporan);
router.use('/dashboard', routerDashboard);
router.use('/audit', routerAudit);

/** GET /api/meta — daftar role & label untuk dropdown di frontend. */
router.get('/meta', auth, (req, res) => {
  res.json({
    role: SEMUA_ROLE.map((r) => ({ nilai: r, label: LABEL_ROLE[r] })),
    adminSistem: ROLE.ADMIN_SISTEM,
  });
});

export default router;
