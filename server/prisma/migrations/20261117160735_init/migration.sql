-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kategori" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "ikon" TEXT NOT NULL DEFAULT '📦',
    "warna" TEXT NOT NULL DEFAULT '#0EA5A4',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Barang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategoriId" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "stokMin" REAL NOT NULL DEFAULT 0,
    "lokasiRak" TEXT NOT NULL DEFAULT '',
    "hargaBeli" INTEGER NOT NULL DEFAULT 0,
    "foto" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Barang_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BatchStok" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barangId" TEXT NOT NULL,
    "batchNo" TEXT NOT NULL DEFAULT '-',
    "qty" REAL NOT NULL DEFAULT 0,
    "expiredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatchStok_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "kontak" TEXT NOT NULL DEFAULT '',
    "alamat" TEXT NOT NULL DEFAULT '',
    "catatan" TEXT NOT NULL DEFAULT '',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TransaksiStok" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipe" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
    "tanggal" DATETIME NOT NULL,
    "supplierId" TEXT,
    "noDokumen" TEXT,
    "tujuan" TEXT,
    "alasan" TEXT,
    "dibuatOlehId" TEXT NOT NULL,
    "disetujuiOlehId" TEXT,
    "approvedAt" DATETIME,
    "catatanTolak" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransaksiStok_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransaksiStok_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransaksiStok_disetujuiOlehId_fkey" FOREIGN KEY ("disetujuiOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemTransaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaksiId" TEXT NOT NULL,
    "barangId" TEXT NOT NULL,
    "batchId" TEXT,
    "qty" REAL NOT NULL,
    "harga" INTEGER,
    "stokSistem" REAL,
    "stokFisik" REAL,
    CONSTRAINT "ItemTransaksi_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "TransaksiStok" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemTransaksi_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemTransaksi_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchStok" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT,
    "detail" TEXT NOT NULL DEFAULT '',
    "waktu" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Kategori_nama_key" ON "Kategori"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Barang_sku_key" ON "Barang"("sku");

-- CreateIndex
CREATE INDEX "Barang_kategoriId_idx" ON "Barang"("kategoriId");

-- CreateIndex
CREATE INDEX "Barang_nama_idx" ON "Barang"("nama");

-- CreateIndex
CREATE INDEX "BatchStok_barangId_idx" ON "BatchStok"("barangId");

-- CreateIndex
CREATE INDEX "BatchStok_expiredAt_idx" ON "BatchStok"("expiredAt");

-- CreateIndex
CREATE UNIQUE INDEX "BatchStok_barangId_batchNo_key" ON "BatchStok"("barangId", "batchNo");

-- CreateIndex
CREATE INDEX "Supplier_nama_idx" ON "Supplier"("nama");

-- CreateIndex
CREATE INDEX "TransaksiStok_tipe_status_idx" ON "TransaksiStok"("tipe", "status");

-- CreateIndex
CREATE INDEX "TransaksiStok_tanggal_idx" ON "TransaksiStok"("tanggal");

-- CreateIndex
CREATE INDEX "TransaksiStok_dibuatOlehId_idx" ON "TransaksiStok"("dibuatOlehId");

-- CreateIndex
CREATE INDEX "ItemTransaksi_transaksiId_idx" ON "ItemTransaksi"("transaksiId");

-- CreateIndex
CREATE INDEX "ItemTransaksi_barangId_idx" ON "ItemTransaksi"("barangId");

-- CreateIndex
CREATE INDEX "AuditLog_waktu_idx" ON "AuditLog"("waktu");

-- CreateIndex
CREATE INDEX "AuditLog_entitas_idx" ON "AuditLog"("entitas");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
