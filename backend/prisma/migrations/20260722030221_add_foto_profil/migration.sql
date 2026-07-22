-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "namaWali" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "kelas" TEXT,
    "fotoProfil" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "santriId" INTEGER NOT NULL,
    "mataPelajaran" TEXT NOT NULL,
    "nilaiUts" REAL NOT NULL,
    "nilaiUas" REAL NOT NULL,
    "semester" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "tanggalInput" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Nilai_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sanksi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "santriId" INTEGER NOT NULL,
    "tanggalPelanggaran" DATETIME NOT NULL,
    "tahun" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sanksi_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "santriId" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "tanggalBayar" DATETIME,
    "jumlah" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pembayaran_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pembayaran_santriId_bulan_tahun_key" ON "Pembayaran"("santriId", "bulan", "tahun");
