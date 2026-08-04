# Sistem Informasi Manajemen Pesantren (SIM Pesantren)

SIM Pesantren adalah aplikasi web full-stack yang dirancang khusus untuk mempermudah administrasi akademik (input nilai UTS/UAS), keamanan (pencatatan pelanggaran sanksi), keuangan (iuran SPP bulanan), dan pengelolaan profil santri secara real-time. Aplikasi ini memiliki arsitektur terpisah antara Frontend (React) dan Backend (Node.js/Express) dengan database relasional (SQLite/Prisma).

---

## 🚀 Cara Menjalankan Aplikasi

Terdapat dua metode untuk menguji atau menjalankan aplikasi ini:

### Metode 1: Uji Coba Instan (Tanpa Install / Zero Setup) — REKOMENDASI CEPAT
Kami menyediakan file prototype mandiri yang berjalan penuh menggunakan simulasi database di browser (`localStorage`). Anda bisa langsung mencobanya tanpa perlu menginstal Node.js/npm.

1. Buka folder root `E:\Pesantren`.
2. Klik ganda (double-click) pada file **[index.html](file:///E:/Pesantren/index.html)** untuk membukanya di web browser Anda (Chrome/Edge/Firefox).
3. Anda dapat langsung menguji fitur login, register santri baru, verifikasi akun pending oleh admin, CRUD modul pendidikan, keamanan, bendahara, serta mencetak rapor/bukti pembayaran.

---

### Metode 2: Menjalankan Aplikasi Full-Stack (Server Produksi)
Gunakan metode ini jika Anda sudah menginstal **Node.js** di sistem Anda.

#### 1. Konfigurasi & Jalankan Backend (Express + Prisma SQLite)
Buka terminal baru di folder `E:\Pesantren\backend`:
```bash
# Masuk ke direktori backend
cd backend

# Install seluruh dependensi
npm install

# Buat database SQLite dan jalankan migrasi tabel
npx prisma migrate dev --name init

# Isi database dengan data dummy (Seed data admin, santri, nilai, sanksi, spp)
npm run db:seed

# Jalankan server API backend
npm start
# Server backend akan berjalan di http://localhost:5000
```

#### 2. Konfigurasi & Jalankan Frontend (React Vite + Tailwind CSS)
Buka terminal baru di folder `E:\Pesantren\frontend`:
```bash
# Masuk ke direktori frontend
cd frontend

# Install seluruh dependensi
npm install

# Jalankan server development Vite
npm run dev
# Frontend akan berjalan di http://localhost:5173
```
*Catatan: Frontend sudah dilengkapi proxy otomatis di `vite.config.js` sehingga seluruh call API akan terarah ke backend port 5000.*

---

## 🔑 Akun Demo Pengujian
Gunakan akun di bawah ini untuk menguji hak akses role (RBAC):

1. **Akses Server / Admin (Akses Penuh CRUD)**:
   * **Email**: `admin@pesantren.com`
   * **Kata Sandi**: `adminpassword`

2. **Akses User / Santri Aktif (Akses Read-Only data sendiri)**:
   * **Email**: `ahmad@pesantren.com`
   * **Kata Sandi**: `studentpassword`

3. **Akun Pendaftaran Baru (Status Pending)**:
   * **Email**: `yusuf@pesantren.com`
   * **Kata Sandi**: `studentpassword`
   * *(Catatan: Akun ini tidak akan bisa login sampai Admin menekan tombol "Aktivasi" di Beranda).*

---

## 📂 Struktur Direktori Project
```text
E:\Pesantren
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Skema Relasional Database (SQLite)
│   │   └── seed.js         # Pengisi data dummy otomatis
│   ├── src/
│   │   ├── controllers/    # Logika bisnis per modul (Auth, Nilai, SPP, Sanksi)
│   │   ├── middleware/     # Proteksi rute (JWT & RBAC)
│   │   ├── routes/         # Pemetaan endpoint API
│   │   └── server.js       # Entry point Express API Server
│   ├── .env                # Port, Database URL, JWT Secret
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx  # Layout utama (Sidebar, Header, Breadcrumbs)
│   │   ├── pages/
│   │   │   ├── Login.jsx   # Login dengan switch role tab
│   │   │   ├── Register.jsx# Form registrasi dengan validasi input
│   │   │   ├── Dashboard.jsx# Statistik & daftar CRUD santri
│   │   │   ├── Pendidikan.jsx# Input nilai & Cetak Rapor
│   │   │   ├── Keamanan.jsx# Buku pelanggaran disiplin
│   │   │   ├── Keuangan.jsx# Grid 12 bulan SPP & Kwitansi
│   │   │   └── Profil.jsx  # Resume lengkap santri (Tabbed)
│   │   ├── utils/
│   │   │   └── api.js      # Client Axios dengan token auth & fallback mock db
│   │   ├── App.jsx         # Router & pelindung rute
│   │   ├── index.css       # Style Tailwind & CSS khusus @media print
│   │   └── main.jsx
│   ├── tailwind.config.js  # Kustomisasi warna islami soft & gold
│   ├── vite.config.js      # Konfigurasi dev server & API proxy
│   └── package.json
│
├── index.html              # Interactive prototype (Demo Mode offline browser)
└── README.md               # Panduan lengkap aplikasi
```
