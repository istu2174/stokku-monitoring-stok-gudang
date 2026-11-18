# StokKu — Monitoring Stok Gudang

Web app untuk memantau stok barang di gudang: barang masuk, barang keluar (dengan persetujuan),
stock opname, stok per batch dengan FEFO, peringatan stok menipis & expired, laporan siap ekspor
Excel/CSV, dan audit log. Ada 6 jabatan (role) dengan hak akses berbeda yang **ditegakkan di backend**,
bukan cuma disembunyikan menunya.

---

## 1. Tech stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js + Express (ESM) |
| Database | SQLite + Prisma ORM (gampang dipindah ke PostgreSQL/MySQL) |
| Auth | JWT di cookie **httpOnly** + bcrypt, middleware cek izin di setiap endpoint |
| Ekspor | `exceljs` (xlsx) dan CSV |

---

## 2. Cara menjalankan

Butuh **Node.js 18+** (dites di Node 24) dan npm.

```bash
# 1. install dependency root + server + client
npm run install:all

# 2. siapkan database (buat dev.db + tabel)
npm run db:migrate

# 3. isi data contoh (6 akun, 10 kategori, 28 barang, transaksi)
npm run db:seed

# 4. jalankan server (4000) + client (5173) sekaligus
npm run dev
```

Buka **http://localhost:5173**.

Kalau ingin mengulang dari nol: `npm run db:reset` (drop database, migrate, lalu seed otomatis).

### Akun demo

| Role | Username | Password | Bisa apa saja |
|---|---|---|---|
| Admin Sistem | `admin` | `admin123` | Semua fitur, kelola user & role |
| Manajer Gudang | `manajer` | `manajer123` | Master barang, approve keluar & opname, laporan, audit |
| Kepala Gudang | `kepala` | `kepala123` | Barang masuk/keluar, approve keluar & opname, laporan |
| Admin Inventori | `inventori` | `inventori123` | Master barang/kategori/supplier, input transaksi & opname |
| Staf Gudang | `staf` | `staf123` | Catat barang masuk, ajukan barang keluar, dashboard ringkas |
| Auditor / Viewer | `auditor` | `auditor123` | Hanya lihat data, laporan, dan audit log |

Halaman login punya panel **"Akun demo"** yang bisa diklik untuk mengisi otomatis.

---

## 3. Hak akses (matriks)

| Fitur | Admin Sistem | Manajer | Kepala | Admin Inventori | Staf | Auditor |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Kelola user & role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lihat dashboard | ✅ | ✅ | ✅ | ✅ | ✅ ringkas | ✅ |
| CRUD barang & kategori | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| CRUD supplier | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Catat barang masuk | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ajukan barang keluar | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve barang keluar | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Stock opname / penyesuaian | ✅ | ✅ approve | ✅ approve | ✅ input | ❌ | ❌ |
| Lihat laporan & ekspor | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Lihat audit log | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

Sumber kebenaran matriks ada di `server/src/lib/roles.js` (`IZIN`). Setiap endpoint memakai
`requireIzin('namaIzin')`, dan untuk approve/tolak dicek lagi sesuai tipe transaksi.

---

## 4. Fitur

**Login & user**
- Login pakai username **atau** email, logout, ganti password sendiri.
- Admin Sistem: tambah/edit user, set role, nonaktifkan akun, reset password.
- Akun nonaktif langsung tidak bisa login (dan token lamanya ikut ditolak, karena user dibaca ulang dari DB tiap request).

**Master data**
- 10 kategori default dengan emoji + warna, plus contoh barang di tiap kategori.
- Nama kategori unik; kategori yang masih dipakai **tidak bisa dihapus**, ditawari pindahkan barangnya dulu.
- Barang: SKU otomatis per kategori (`MAK-0001`), satuan, stok minimum, lokasi rak, harga beli, aktif/nonaktif.
- Supplier: CRUD, tidak bisa dihapus kalau sudah dipakai transaksi (nonaktifkan saja).

**Transaksi stok**
- **Barang masuk**: penerimaan dari supplier, per batch + expired + harga. Stok langsung bertambah.
- **Barang keluar**: diajukan dulu, stok **baru berkurang setelah disetujui** (Kepala/Manajer/Admin Sistem). Pemotongan stok mengikuti **FEFO** (batch expired terdekat keluar dulu).
- **Stock opname / penyesuaian**: input stok fisik, selisihnya menunggu persetujuan. Saat disetujui, stok dihitung ulang supaya hasil akhirnya tepat sama dengan angka fisik.
- **Stok tidak bisa minus**: dicek saat pengajuan, dicek lagi saat approve (stok bisa berubah di antaranya).
- Semua transaksi tercatat di kartu stok dengan saldo berjalan.

**Monitoring & laporan**
- Dashboard: total barang, stok menipis/habis, expired ≤30 hari (dan yang sudah lewat), antrean approval, nilai persediaan, nilai pergerakan 14 hari, komposisi kategori, aktivitas terbaru. Staf dapat versi ringkas.
- Kartu stok per barang dengan filter tanggal.
- Laporan: stok, menipis & habis, nilai persediaan per kategori, mutasi stok, expired. Semua bisa diunduh **xlsx** atau **CSV**.
- Audit log: login, perubahan master, transaksi, approve/tolak. Hanya bisa dibaca (append-only).

**UI**
- Status stok berwarna: hijau (aman), kuning (menipis), merah (habis/expired).
- Chip kategori berwarna + emoji, tabel zebra tipis sudut membulat.
- Form besar (nyaman di tablet/HP), konfirmasi sebelum hapus/tolak/approve, toast notifikasi.
- Responsif 375px (bottom nav) sampai 1280px+ (sidebar).

---

## 5. Struktur folder

```
stokku/
├── client/                     # React + Vite
│   ├── src/
│   │   ├── components/         # Layout, Modal, Toast, Konfirmasi, Ui, PemilihBarang
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/                # api.js (fetch), format.js (rupiah/tanggal/status)
│   │   ├── pages/              # Dashboard, Barang, Kategori, Supplier, BarangMasuk,
│   │   │                       # BarangKeluar, Opname, Persetujuan, Riwayat, Laporan,
│   │   │                       # Audit, Users, Profil, KartuStok, Login
│   │   ├── App.jsx             # routing + penjaga izin
│   │   └── main.jsx
│   └── vite.config.js          # proxy /api → localhost:4000
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # 8 model
│   │   ├── migrations/
│   │   └── seed.js             # data contoh
│   └── src/
│       ├── controllers/        # auth, user, barang, kategori, supplier, transaksi,
│       │                       # kartuStok, laporan, dashboard, audit
│       ├── middlewares/        # auth.js (JWT + requireIzin), error.js
│       ├── services/           # stokService (FEFO, cegah minus), skuService
│       ├── lib/                # prisma, errors, roles (matriks izin), audit
│       ├── routes/             # satu file per resource
│       ├── utils/validasi.js
│       ├── app.js              # express app (cors, cookie, static dist)
│       └── index.js            # entry, graceful shutdown
└── README.md
```

---

## 6. API ringkas

Semua endpoint di bawah `/api`. Auth lewat cookie `stokku_token` (atau header `Authorization: Bearer <token>`).

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/login` · `/auth/logout` · `/auth/password` | login, logout, ganti password |
| GET | `/auth/me` | user + daftar izinnya |
| GET/POST/PUT | `/users`, `/users/:id`, `/users/:id/password` | kelola user (Admin Sistem) |
| GET/POST/PUT/DELETE | `/kategori`, `/kategori/:id` | hapus pakai `?pindahKe=<id>` kalau masih dipakai |
| GET/POST/PUT/DELETE | `/supplier`, `/supplier/:id` | master supplier |
| GET/POST/PUT/DELETE | `/barang`, `/barang/:id` | filter `q`, `kategoriId`, `status`, pagination |
| GET | `/barang/:id/kartu-stok?dari=&ke=` | riwayat + saldo berjalan |
| GET | `/transaksi?tipe=&status=&dari=&ke=&q=` | riwayat transaksi |
| GET | `/transaksi/menunggu` | antrean persetujuan |
| POST | `/transaksi/masuk` · `/transaksi/keluar` · `/transaksi/opname` | pencatatan |
| PUT | `/transaksi/:id/approve` · `/transaksi/:id/tolak` | persetujuan |
| GET | `/dashboard` | ringkasan (versi ringkas untuk Staf) |
| GET | `/laporan/stok` · `/menipis` · `/nilai` · `/mutasi` · `/expired` | tambahkan `?format=xlsx` atau `?format=csv` |
| GET | `/audit` | audit log dengan filter |

Format error selalu `{ "message": "..." }` dalam bahasa Indonesia.

---

## 7. Catatan teknis

- **Stok tidak disimpan di tabel `Barang`.** Stok selalu dihitung dari jumlah `BatchStok`, jadi tidak ada
  stok "hantu" dan FEFO bisa jalan. Setiap perubahan stok dibungkus `prisma.$transaction`.
- **SQLite tidak mendukung enum Prisma**, jadi `role`, `tipe`, dan `status` disimpan sebagai `String`
  dengan nilai yang dijaga terpusat di `server/src/lib/roles.js`.
- **`qty` bertipe Float** supaya kg/liter (2.5) valid; **`hargaBeli` Int** supaya tidak ada pembulatan uang.
- **JWT 8 jam** disimpan di cookie `httpOnly` + `sameSite=lax`, jadi tidak bisa dibaca JavaScript.
- **Audit log tidak menggagalkan aksi utama** kalau penulisannya error (hanya dicatat di console).
- **Seed aman diulang**: semua data lama dihapus dulu, jadi `npm run db:seed` berkali-kali tidak menumpuk.

### Konfigurasi

`server/.env`:

```
DATABASE_URL="file:./dev.db"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
JWT_SECRET="ganti-dengan-string-panjang-acak"
NODE_ENV=development
```

Kalau port 4000 dipakai aplikasi lain, ubah `PORT` **dan** proxy di `client/vite.config.js`.

### Build produksi

```bash
npm run build     # hasil di client/dist
npm start         # server menyajikan API + file hasil build di http://localhost:4000
```

---

## 8. Checklist uji manual

1. Login tiap akun demo, pastikan menu yang muncul sesuai matriks.
2. Staf: ajukan barang keluar → status **Menunggu**, stok belum berkurang.
3. Kepala/Manajer: buka **Persetujuan** → setujui → stok berkurang, kartu stok bertambah satu baris.
4. Coba ajukan qty melebihi stok → ditolak dengan pesan jelas.
5. Admin Inventori: input stock opname dengan stok fisik berbeda → setujui → stok sama dengan angka fisik.
6. Dashboard: kartu menipis/habis/expired terisi, grafik dan donut ter-render.
7. Laporan: unduh Excel & CSV, buka di Excel.
8. Hapus kategori yang masih dipakai barang → muncul tawaran pindahkan barang dulu.
9. Nonaktifkan user (Admin Sistem) → user itu tidak bisa login lagi.
10. Cek audit log: aksi login, tambah barang, approve tercatat.

---

## 9. Di luar scope (sesuai PRD)

Multi-gudang/cabang, scan barcode/QR, integrasi kasir/akuntansi, notifikasi email/WhatsApp, aplikasi mobile native, dan deploy cloud.
