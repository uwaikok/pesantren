import axios from 'axios';

// Konfigurasi base Axios
const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

// Interceptor untuk menyisipkan token JWT di setiap request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('simesra_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- SIMULASI DATABASE LOCALSTORAGE (FALLBACK DEMO MODE) ---
// Data dummy yang sama dengan backend seed.js
const seedMockDatabase = () => {
  if (!localStorage.getItem('db_initialized_v5')) {
    const users = [
      {
        id: 1,
        nama: 'RIFKI AHMAD DZULFIKRI',
        email: 'admin@pesantren.com',
        password: 'adminpassword', // Simpan plain text untuk kemudahan demo
        noHp: '081234567890',
        alamat: 'Komplek Pesantren Miftahul Huda As-Syadzili No. 1',
        role: 'ADMIN',
        status: 'ACTIVE',
        fotoProfil: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 10,
        nama: 'ADMIN KEDUA',
        email: 'admin2@pesantren.com',
        password: 'admin2password',
        noHp: '081234567891',
        alamat: 'Komplek Pesantren Miftahul Huda As-Syadzili No. 2',
        role: 'ADMIN',
        status: 'ACTIVE',
        fotoProfil: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        nama: 'Ahmad Fauzi',
        email: 'ahmad@pesantren.com',
        password: 'studentpassword',
        noHp: '081223344556',
        alamat: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
        namaWali: 'Bp. Slamet Fauzi',
        kelas: 'Tsanawi 3',
        role: 'SANTRI',
        status: 'ACTIVE',
        fotoProfil: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        nama: 'Siti Aisyah',
        email: 'siti@pesantren.com',
        password: 'studentpassword',
        noHp: '085778899001',
        alamat: 'Jl. Mawar Gg. Masjid No. 4, Ujungberung, Bandung',
        namaWali: 'Ibu Hajah Aminah',
        kelas: 'Ibtida 3',
        role: 'SANTRI',
        status: 'ACTIVE',
        fotoProfil: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        nama: 'Muhammad Yusuf',
        email: 'yusuf@pesantren.com',
        password: 'studentpassword',
        noHp: '089911223344',
        alamat: 'Dusun Sukamaju RT 02 RW 05, Ciamis',
        namaWali: 'Bp. H. Abdul Ghofur',
        kelas: 'Imdad Putra',
        role: 'SANTRI',
        status: 'PENDING',
        fotoProfil: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        nama: 'Fatimah Azzahra',
        email: 'fatimah@pesantren.com',
        password: 'studentpassword',
        noHp: '081399887766',
        alamat: 'Perum Permata Indah Blok C/10, Sleman, Yogyakarta',
        namaWali: 'Bp. Rahmat Hadi',
        kelas: 'Imdad Putri',
        role: 'SANTRI',
        status: 'PENDING',
        fotoProfil: null,
        createdAt: new Date().toISOString()
      }
    ];

    const nilai = [
      { id: 1, santriId: 2, mataPelajaran: 'Al-Qur\'an & Tajwid', nilaiUts: 85, nilaiUas: 90, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 2, santriId: 2, mataPelajaran: 'Fiqih Ibadah', nilaiUts: 80, nilaiUas: 88, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 3, santriId: 2, mataPelajaran: 'Bahasa Arab (Nahwu)', nilaiUts: 72, nilaiUas: 78, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 4, santriId: 2, mataPelajaran: 'Aqidah Akhlak', nilaiUts: 90, nilaiUas: 92, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 5, santriId: 2, mataPelajaran: 'Al-Qur\'an & Tajwid', nilaiUts: 88, nilaiUas: 92, semester: 'GENAP', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 6, santriId: 2, mataPelajaran: 'Fiqih Ibadah', nilaiUts: 82, nilaiUas: 85, semester: 'GENAP', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 7, santriId: 2, mataPelajaran: 'Bahasa Arab (Nahwu)', nilaiUts: 78, nilaiUas: 82, semester: 'GENAP', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 8, santriId: 2, mataPelajaran: 'Aqidah Akhlak', nilaiUts: 88, nilaiUas: 90, semester: 'GENAP', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 9, santriId: 3, mataPelajaran: 'Al-Qur\'an & Tajwid', nilaiUts: 95, nilaiUas: 96, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 10, santriId: 3, mataPelajaran: 'Fiqih Ibadah', nilaiUts: 88, nilaiUas: 92, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 11, santriId: 3, mataPelajaran: 'Bahasa Arab (Nahwu)', nilaiUts: 85, nilaiUas: 90, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() },
      { id: 12, santriId: 3, mataPelajaran: 'Aqidah Akhlak', nilaiUts: 92, nilaiUas: 95, semester: 'GANJIL', tahunAjaran: '2025/2026', tanggalInput: new Date().toISOString() }
    ];

    const sanksi = [
      { id: 1, santriId: 2, tanggalPelanggaran: '2026-02-14', tahun: '2025/2026', deskripsi: 'Terlambat shalat jamaah Subuh di masjid sebanyak 3 kali berturut-turut.', kategori: 'RINGAN' },
      { id: 2, santriId: 2, tanggalPelanggaran: '2026-04-10', tahun: '2025/2026', deskripsi: 'Kedapatan menyimpan handphone pribadi tanpa surat izin tertulis dari pengasuh.', kategori: 'SEDANG' },
      { id: 3, santriId: 3, tanggalPelanggaran: '2026-05-20', tahun: '2025/2026', deskripsi: 'Keluar komplek pesantren putri tanpa jilbab / melebihi batas waktu izin keluar.', kategori: 'SEDANG' }
    ];

    const pembayaran = [
      { id: 1, santriId: 2, bulan: 1, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-01-05', jumlah: 300000 },
      { id: 2, santriId: 2, bulan: 2, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-02-04', jumlah: 300000 },
      { id: 3, santriId: 2, bulan: 3, tahun: 2026, status: 'BELUM_BAYAR', tanggalBayar: null, jumlah: 300000 },
      { id: 4, santriId: 2, bulan: 4, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-04-06', jumlah: 300000 },
      { id: 5, santriId: 3, bulan: 1, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-01-08', jumlah: 300000 },
      { id: 6, santriId: 3, bulan: 2, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-02-07', jumlah: 300000 },
      { id: 7, santriId: 3, bulan: 3, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-03-05', jumlah: 300000 },
      { id: 8, santriId: 3, bulan: 4, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-04-04', jumlah: 300000 },
      { id: 9, santriId: 3, bulan: 5, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-05-02', jumlah: 300000 }
    ];

    const initialNotifs = [
      {
        id: 1,
        judul: 'Pengumuman Ujian Semester Genap',
        isi: 'Ujian Akhir Semester Genap dijadwalkan mulai tanggal 10 Agustus 2026. Harap seluruh santri mempersiapkan administrasi dan kartu ujian.',
        kategori: 'UJIAN',
        santriId: null,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem('mock_users', JSON.stringify(users));
    localStorage.setItem('mock_nilai', JSON.stringify(nilai));
    localStorage.setItem('mock_sanksi', JSON.stringify(sanksi));
    localStorage.setItem('mock_pembayaran', JSON.stringify(pembayaran));
    localStorage.setItem('mock_notifications', JSON.stringify(initialNotifs));
    localStorage.setItem('db_initialized_v5', 'true');
  }
};

// Panggil inisialisasi database localstorage
seedMockDatabase();

// PENTING: Bersihkan flag mock DB yang tersimpan dari sesi sebelumnya
// agar aplikasi selalu coba backend nyata terlebih dahulu setiap kali halaman dibuka
localStorage.removeItem('use_mock_db');
window.useMockDb = false;

// Helper get database dari localStorage
const getMockData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const saveMockData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Cek siapa user yang sedang login berdasarkan token
const getLoggedInUser = () => {
  const token = sessionStorage.getItem('simesra_token');
  if (!token) return null;
  try {
    // Di demo mode, token hanyalah JSON string user
    const parsed = JSON.parse(token);
    return parsed;
  } catch (e) {
    // Token adalah JWT asli dari backend — decode payload tanpa verifikasi
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload; // { id, nama, email, role, status }
      }
    } catch (e2) {
      // ignore
    }
    return null;
  }
};

// Buat wrapper request API
const request = async (method, url, data = null, params = null) => {
  // Hanya gunakan window.useMockDb (in-memory) — TIDAK dari localStorage
  // Ini memastikan setiap refresh halaman, app selalu coba backend nyata dulu
  const useMock = window.useMockDb === true;

  if (!useMock) {
    try {
      // Coba panggil server backend asli
      const response = await api({ method, url, data, params });
      // Jika berhasil — pastikan mock mode OFF
      window.useMockDb = false;
      return response.data;
    } catch (error) {
      // Jika error dari backend berupa HTTP status (server online, ada error logika):
      if (error.response) {
        return Promise.reject(error.response.data || { message: 'Terjadi kesalahan pada server' });
      }
      console.error('Koneksi ke server backend gagal:', error);
      return Promise.reject({ message: 'Gagal terhubung ke server backend. Pastikan server lokal Anda sudah berjalan.' });
    }
  }

  // --- LOGIKA MOCK API VIA LOCALSTORAGE ---
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const currentUser = getLoggedInUser();

        // 1. ROUTING: /auth/login
        if (url === '/auth/login' && method.toLowerCase() === 'post') {
          const { email, password } = data;
          const users = getMockData('mock_users');
          const found = users.find(u => u.email === email && u.password === password);
          if (!found) {
            return reject({ message: 'Email atau password salah' });
          }
          if (found.status === 'PENDING') {
            return reject({ message: 'Akun Anda belum aktif. Silakan hubungi admin untuk aktivasi.' });
          }
          // Simpan token (di demo mode, token kita adalah detail user itu sendiri)
          sessionStorage.setItem('simesra_token', JSON.stringify(found));
          return resolve({ message: 'Login berhasil', token: JSON.stringify(found), user: found });
        }

        // 2. ROUTING: /auth/register
        if (url === '/auth/register' && method.toLowerCase() === 'post') {
          const { nama, email, password, noHp, alamat, namaWali, kelas, role } = data;
          const users = getMockData('mock_users');
          
          if (users.some(u => u.email === email)) {
            return reject({ message: 'Email sudah terdaftar' });
          }

          // Cek apakah admin sedang login
          const isAdminCreating = currentUser && currentUser.role === 'ADMIN';

          const newUser = {
            id: Date.now(),
            nama,
            email,
            password,
            noHp,
            alamat,
            namaWali: role === 'SANTRI' ? namaWali : null,
            kelas: role === 'SANTRI' ? kelas : null,
            role: role || 'SANTRI',
            status: isAdminCreating ? 'ACTIVE' : 'PENDING',
            createdAt: new Date().toISOString()
          };

          users.push(newUser);
          saveMockData('mock_users', users);

          return resolve({
            message: newUser.status === 'PENDING'
              ? 'Pendaftaran berhasil. Menunggu aktivasi dari Admin.'
              : 'Akun berhasil dibuat.',
            user: newUser
          });
        }

        // 3. ROUTING: /auth/me
        if (url === '/auth/me' && method.toLowerCase() === 'get') {
          if (!currentUser) return reject({ message: 'Token tidak valid' });
          // Selalu ambil data terbaru dari mock_users (bukan data lama di token)
          const users = getMockData('mock_users');
          const latestUser = users.find(u => u.id === currentUser.id);
          if (!latestUser) return reject({ message: 'User tidak ditemukan' });
          // Sync token dengan data terbaru
          const userForToken = { ...latestUser };
          sessionStorage.setItem('simesra_token', JSON.stringify(userForToken));
          // Return tanpa password
          const { password, ...safeUser } = latestUser;
          return resolve(safeUser);
        }

        // 3b. ROUTING: /auth/change-password (Ganti password sendiri — berlaku untuk ADMIN & SANTRI)
        if (url === '/auth/change-password' && method.toLowerCase() === 'post') {
          if (!currentUser) return reject({ message: 'Token tidak valid atau sesi habis' });
          const { passwordLama, passwordBaru } = data;
          if (!passwordLama || !passwordBaru) {
            return reject({ message: 'Password lama dan password baru wajib diisi' });
          }
          if (passwordBaru.length < 6) {
            return reject({ message: 'Kata sandi baru minimal 6 karakter' });
          }

          const users = getMockData('mock_users');
          const idx = users.findIndex(u => u.id === currentUser.id);
          if (idx === -1) return reject({ message: 'Akun tidak ditemukan' });

          // Verifikasi password lama dengan data terbaru di database (bukan dari token)
          if (users[idx].password !== passwordLama) {
            return reject({ message: 'Kata sandi lama yang Anda masukkan salah' });
          }

          // Pastikan password baru tidak sama dengan password lama
          if (passwordBaru === passwordLama) {
            return reject({ message: 'Kata sandi baru tidak boleh sama dengan kata sandi lama' });
          }

          // Ganti password di database mock
          users[idx].password = passwordBaru;
          saveMockData('mock_users', users);

          // Buat token baru TANPA field password (aman) dan simpan ke sessionStorage
          const { password: _pw, ...safeUserForToken } = users[idx];
          sessionStorage.setItem('simesra_token', JSON.stringify(safeUserForToken));

          return resolve({ message: 'Kata sandi berhasil diperbarui. Password lama tidak berlaku lagi.' });
        }

        // 3c. ROUTING: /auth/profile (GET & PUT)
        if (url === '/auth/profile' && method.toLowerCase() === 'get') {
          if (!currentUser) return reject({ message: 'Token tidak valid' });
          const users = getMockData('mock_users');
          const latestUser = users.find(u => u.id === currentUser.id);
          if (!latestUser) return reject({ message: 'User tidak ditemukan' });
          const { password, ...safeUser } = latestUser;
          return resolve({
            user: safeUser,
            keuangan: { tahun: new Date().getFullYear(), totalTunggakan: 0, payments: [] }
          });
        }

        if (url === '/auth/profile' && method.toLowerCase() === 'put') {
          if (!currentUser) return reject({ message: 'Token tidak valid' });
          const { nama, email, password, noHp, alamat } = data;
          const users = getMockData('mock_users');
          const idx = users.findIndex(u => u.id === currentUser.id);
          if (idx === -1) return reject({ message: 'User tidak ditemukan' });

          if (email && email !== users[idx].email) {
            if (users.some(u => u.email === email && u.id !== currentUser.id)) {
              return reject({ message: 'Email sudah terdaftar oleh pengguna lain' });
            }
          }

          if (nama) users[idx].nama = nama;
          if (email) users[idx].email = email;
          if (noHp !== undefined) users[idx].noHp = noHp;
          if (alamat !== undefined) users[idx].alamat = alamat;
          if (password) users[idx].password = password;

          saveMockData('mock_users', users);

          // Update token
          const { password: _p, ...safeUser } = users[idx];
          sessionStorage.setItem('simesra_token', JSON.stringify(safeUser));

          return resolve({
            message: 'Profil berhasil diperbarui',
            user: { ...safeUser, role: 'ADMIN', status: 'ACTIVE' }
          });
        }

        // 4. ROUTING: /admin/stats
        if (url === '/admin/stats' && method.toLowerCase() === 'get') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const users = getMockData('mock_users').filter(u => u.role === 'SANTRI');
          const sanksi = getMockData('mock_sanksi');
          const pembayaran = getMockData('mock_pembayaran');

          const activeCount = users.filter(u => u.status === 'ACTIVE').length;
          const inactiveCount = users.length - activeCount;
          
          // Hitung lunas bulan ini
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          const lunasThisMonth = pembayaran.filter(p => p.bulan === currentMonth && p.tahun === currentYear && p.status === 'LUNAS').length;
          const belumThisMonth = activeCount - lunasThisMonth;

          // Chart per kelas
          const classes = {};
          users.filter(u => u.status === 'ACTIVE').forEach(u => {
            const k = u.kelas || 'Belum Ditentukan';
            classes[k] = (classes[k] || 0) + 1;
          });

          const totalBeasiswa = users.filter(u => u.isBeasiswa === true || u.isBeasiswa === 'true').length;

          return resolve({
            totalSantri: users.length,
            activeSantri: activeCount,
            inactiveSantri: inactiveCount,
            totalSanksi: sanksi.length,
            totalBeasiswa: totalBeasiswa,
            sppStats: {
              bulan: currentMonth,
              tahun: currentYear,
              lunas: lunasThisMonth,
              belumBayar: belumThisMonth < 0 ? 0 : belumThisMonth,
            },
            classChart: Object.keys(classes).map(k => ({ kelas: k, jumlah: classes[k] }))
          });
        }

        // 5. ROUTING: /admin/santri
        if (url === '/admin/santri' && method.toLowerCase() === 'get') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          let users = getMockData('mock_users').filter(u => u.role === 'SANTRI');
          const { search, kelas } = params || {};
          if (search) {
            const keywords = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
            if (keywords.length > 0) {
              users = users.filter(u => {
                return keywords.every(kw => {
                  const nameMatch = u.nama.toLowerCase().includes(kw);
                  const classMatch = u.kelas ? u.kelas.toLowerCase().includes(kw) : false;
                  const waliMatch = u.namaWali ? u.namaWali.toLowerCase().includes(kw) : false;
                  return nameMatch || classMatch || waliMatch;
                });
              });
            }
          }
          if (kelas) {
            users = users.filter(u => u.kelas === kelas);
          }
          return resolve(users);
        }

        // 5b. ROUTING: /admin/santri (POST)
        if (url === '/admin/santri' && method.toLowerCase() === 'post') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const { nama, email, password, noHp, alamat, namaWali, kelas, isBeasiswa } = data;
          const users = getMockData('mock_users');
          if (email && users.some(u => u.email === email)) {
            return reject({ message: 'Email sudah terdaftar oleh pengguna lain' });
          }

          const newSantri = {
            id: Date.now(),
            nama,
            email: email || null,
            password: password || null,
            noHp,
            alamat,
            namaWali,
            kelas,
            isBeasiswa: isBeasiswa === true || isBeasiswa === 'true',
            role: 'SANTRI',
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          };

          users.push(newSantri);
          saveMockData('mock_users', users);

          return resolve({
            message: 'Santri berhasil ditambahkan.',
            user: newSantri
          });
        }

        // 5c. ROUTING: /admin/santri/promote/bulk (PUT)
        if (url === '/admin/santri/promote/bulk' && method.toLowerCase() === 'put') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const { studentIds, nextClass, status } = data;
          const users = getMockData('mock_users');
          users.forEach(u => {
            if (studentIds.includes(u.id)) {
              if (nextClass !== undefined) u.kelas = nextClass;
              if (status !== undefined) u.status = status;
            }
          });
          saveMockData('mock_users', users);
          return resolve({ message: 'Kenaikan kelas massal berhasil diproses' });
        }

        // 6. ROUTING: /admin/users/pending
        if (url === '/admin/users/pending' && method.toLowerCase() === 'get') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const pending = getMockData('mock_users').filter(u => u.status === 'PENDING');
          return resolve(pending);
        }

        // 7. ROUTING: /admin/users/:id/verify
        if (url.startsWith('/admin/users/') && url.endsWith('/verify') && method.toLowerCase() === 'put') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[3]);
          const users = getMockData('mock_users');
          const idx = users.findIndex(u => u.id === id);
          if (idx === -1) return reject({ message: 'User tidak ditemukan' });
          users[idx].status = 'ACTIVE';
          saveMockData('mock_users', users);
          return resolve({ message: 'Akun berhasil diaktifkan', user: users[idx] });
        }

        // 8. ROUTING: /admin/santri/:id (UPDATE)
        if (url.startsWith('/admin/santri/') && method.toLowerCase() === 'put') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[3]);
          const users = getMockData('mock_users');
          const idx = users.findIndex(u => u.id === id);
          if (idx === -1) return reject({ message: 'Santri tidak ditemukan' });
          
          users[idx] = { ...users[idx], ...data };
          saveMockData('mock_users', users);
          
          // Sinkronkan token jika user yang diedit adalah user yang sedang login
          if (currentUser.id === id) {
            sessionStorage.setItem('simesra_token', JSON.stringify(users[idx]));
          }
          return resolve({ message: 'Data santri berhasil diperbarui', user: users[idx] });
        }

        // 9. ROUTING: /admin/santri/:id (DELETE)
        if (url.startsWith('/admin/santri/') && method.toLowerCase() === 'delete') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[3]);
          
          let users = getMockData('mock_users');
          users = users.filter(u => u.id !== id);
          saveMockData('mock_users', users);

          // Cascade delete
          let nilai = getMockData('mock_nilai').filter(n => n.santriId !== id);
          saveMockData('mock_nilai', nilai);

          let sanksi = getMockData('mock_sanksi').filter(s => s.santriId !== id);
          saveMockData('mock_sanksi', sanksi);

          let pembayaran = getMockData('mock_pembayaran').filter(p => p.santriId !== id);
          saveMockData('mock_pembayaran', pembayaran);

          return resolve({ message: 'Data santri dan riwayatnya berhasil dihapus' });
        }

        // 10. ROUTING: /akademik (CREATE)
        if (url === '/akademik' && method.toLowerCase() === 'post') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const nilai = getMockData('mock_nilai');
          const newNilai = {
            id: Date.now(),
            santriId: parseInt(data.santriId),
            mataPelajaran: data.mataPelajaran,
            nilaiUts: parseFloat(data.nilaiUts),
            nilaiUas: parseFloat(data.nilaiUas),
            semester: data.semester,
            tahunAjaran: data.tahunAjaran,
            tanggalInput: new Date().toISOString()
          };
          nilai.push(newNilai);
          saveMockData('mock_nilai', nilai);
          return resolve({ message: 'Nilai berhasil diinput', data: newNilai });
        }

        // 11. ROUTING: /akademik/:id (UPDATE)
        if (url.startsWith('/akademik/') && method.toLowerCase() === 'put') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[2]);
          const nilai = getMockData('mock_nilai');
          const idx = nilai.findIndex(n => n.id === id);
          if (idx === -1) return reject({ message: 'Nilai tidak ditemukan' });

          nilai[idx] = { ...nilai[idx], ...data, nilaiUts: parseFloat(data.nilaiUts), nilaiUas: parseFloat(data.nilaiUas) };
          saveMockData('mock_nilai', nilai);
          return resolve({ message: 'Nilai berhasil diperbarui', data: nilai[idx] });
        }

        // 12. ROUTING: /akademik/:id (DELETE)
        if (url.startsWith('/akademik/') && method.toLowerCase() === 'delete') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[2]);
          let nilai = getMockData('mock_nilai');
          nilai = nilai.filter(n => n.id !== id);
          saveMockData('mock_nilai', nilai);
          return resolve({ message: 'Nilai berhasil dihapus' });
        }

        // 13. ROUTING: /akademik/santri/:id atau /akademik/my
        if (url.startsWith('/akademik/santri/') || url === '/akademik/my') {
          const isMy = url === '/akademik/my';
          const targetId = isMy ? currentUser.id : parseInt(url.split('/')[3]);

          if (!isMy && currentUser.role !== 'ADMIN' && currentUser.id !== targetId) {
            return reject({ message: 'Unauthorized' });
          }

          const nilai = getMockData('mock_nilai').filter(n => n.santriId === targetId);
          const { tahunAjaran, semester } = params || {};
          let filtered = nilai;
          if (tahunAjaran) filtered = filtered.filter(n => n.tahunAjaran === tahunAjaran);
          if (semester) filtered = filtered.filter(n => n.semester === semester);
          return resolve(filtered);
        }

        // 14. ROUTING: /keamanan (CREATE)
        if (url === '/keamanan' && method.toLowerCase() === 'post') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const sanksi = getMockData('mock_sanksi');
          const newSanksi = {
            id: Date.now(),
            santriId: parseInt(data.santriId),
            tanggalPelanggaran: data.tanggalPelanggaran,
            tahun: data.tahun,
            deskripsi: data.deskripsi,
            kategori: data.kategori
          };
          sanksi.push(newSanksi);
          saveMockData('mock_sanksi', sanksi);
          return resolve({ message: 'Pelanggaran berhasil dicatat', data: newSanksi });
        }

        // 15. ROUTING: /keamanan/:id (UPDATE)
        if (url.startsWith('/keamanan/') && method.toLowerCase() === 'put') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[2]);
          const sanksi = getMockData('mock_sanksi');
          const idx = sanksi.findIndex(s => s.id === id);
          if (idx === -1) return reject({ message: 'Sanksi tidak ditemukan' });

          sanksi[idx] = { ...sanksi[idx], ...data };
          saveMockData('mock_sanksi', sanksi);
          return resolve({ message: 'Sanksi berhasil diperbarui', data: sanksi[idx] });
        }

        // 16. ROUTING: /keamanan/:id (DELETE)
        if (url.startsWith('/keamanan/') && method.toLowerCase() === 'delete') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[2]);
          let sanksi = getMockData('mock_sanksi');
          sanksi = sanksi.filter(s => s.id !== id);
          saveMockData('mock_sanksi', sanksi);
          return resolve({ message: 'Sanksi berhasil dihapus' });
        }

        // 17. ROUTING: /keamanan/santri/:id atau /keamanan/my
        if (url.startsWith('/keamanan/santri/') || url === '/keamanan/my') {
          const isMy = url === '/keamanan/my';
          const targetId = isMy ? currentUser.id : parseInt(url.split('/')[3]);

          if (!isMy && currentUser.role !== 'ADMIN' && currentUser.id !== targetId) {
            return reject({ message: 'Unauthorized' });
          }

          const sanksi = getMockData('mock_sanksi').filter(s => s.santriId === targetId);
          const { kategori, tahun } = params || {};
          let filtered = sanksi;
          if (kategori) filtered = filtered.filter(s => s.kategori === kategori);
          if (tahun) filtered = filtered.filter(s => s.tahun === tahun);
          return resolve(filtered);
        }

        // 18. ROUTING: /keuangan (SAVE SPP)
        if (url === '/keuangan' && method.toLowerCase() === 'post') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const pembayaran = getMockData('mock_pembayaran');
          const { santriId, bulan, tahun, status, jumlah, tanggalBayar } = data;

          const idx = pembayaran.findIndex(p => p.santriId === parseInt(santriId) && p.bulan === parseInt(bulan) && p.tahun === parseInt(tahun));
          
          const newRecord = {
            id: idx !== -1 ? pembayaran[idx].id : Date.now(),
            santriId: parseInt(santriId),
            bulan: parseInt(bulan),
            tahun: parseInt(tahun),
            status,
            tanggalBayar: status === 'LUNAS' ? (tanggalBayar || new Date().toISOString().split('T')[0]) : null,
            jumlah: jumlah !== undefined ? parseFloat(jumlah) : 300000
          };

          if (idx !== -1) {
            pembayaran[idx] = newRecord;
          } else {
            pembayaran.push(newRecord);
          }
          saveMockData('mock_pembayaran', pembayaran);
          return resolve({ message: 'Pembayaran SPP berhasil disimpan', data: newRecord });
        }

        // 19. ROUTING: /keuangan/santri/:id atau /keuangan/my
        if (url.startsWith('/keuangan/santri/') || url === '/keuangan/my') {
          const isMy = url === '/keuangan/my';
          const targetId = isMy ? currentUser.id : parseInt(url.split('/')[3]);
          const targetTahun = params?.tahun ? parseInt(params.tahun) : new Date().getFullYear();

          if (!isMy && currentUser.role !== 'ADMIN' && currentUser.id !== targetId) {
            return reject({ message: 'Unauthorized' });
          }

          const pembayaran = getMockData('mock_pembayaran').filter(p => p.santriId === targetId && p.tahun === targetTahun);
          
          // Generate 12 months
          const paymentsList = [];
          let totalTunggakan = 0;
          let totalTerbayar = 0;
          const defaultAmount = 350000;

          for (let m = 1; m <= 12; m++) {
            const dbRecord = pembayaran.find(p => p.bulan === m);
            if (dbRecord) {
              paymentsList.push(dbRecord);
              if (dbRecord.status === 'LUNAS') totalTerbayar += dbRecord.jumlah;
              else totalTunggakan += dbRecord.jumlah;
            } else {
              paymentsList.push({
                id: null,
                santriId: targetId,
                bulan: m,
                tahun: targetTahun,
                status: 'BELUM_BAYAR',
                tanggalBayar: null,
                jumlah: defaultAmount
              });
              totalTunggakan += defaultAmount;
            }
          }

          return resolve({
            santriId: targetId,
            tahun: targetTahun,
            totalTunggakan,
            totalTerbayar,
            payments: paymentsList
          });
        }

        // 20. ROUTING: /users/:id/profile (AGGREGATE)
        if (url.startsWith('/users/') && url.endsWith('/profile') && method.toLowerCase() === 'get') {
          const targetId = parseInt(url.split('/')[2]);
          if (currentUser.role !== 'ADMIN' && currentUser.id !== targetId) {
            return reject({ message: 'Unauthorized' });
          }

          const users = getMockData('mock_users');
          const foundUser = users.find(u => u.id === targetId);
          if (!foundUser) return reject({ message: 'User tidak ditemukan' });

          const userSelect = { ...foundUser };
          delete userSelect.password;

          const nilai = getMockData('mock_nilai').filter(n => n.santriId === targetId);
          const sanksi = getMockData('mock_sanksi').filter(s => s.santriId === targetId);
          
          const targetTahun = new Date().getFullYear();
          const payments = getMockData('mock_pembayaran').filter(p => p.santriId === targetId && p.tahun === targetTahun);
          
          const getMockStartMonth = (tanggalMasuk, targetTahun) => {
            if (!tanggalMasuk) return 1;
            const masuk = new Date(tanggalMasuk);
            const tahunMasuk = masuk.getFullYear();
            const bulanMasuk = masuk.getMonth() + 1;
            if (tahunMasuk > targetTahun) return 13;
            if (tahunMasuk === targetTahun) return bulanMasuk;
            return 1;
          };

          const getMockIsMonthDue = (m, targetTahun) => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            if (targetTahun < currentYear) return true;
            if (targetTahun === currentYear) return m <= currentMonth;
            return false;
          };

          const startMonth = getMockStartMonth(userSelect?.tanggalMasuk, targetTahun);
          const paymentsList = [];
          let totalTunggakan = 0;
          let unpaidMonths = 0;
          const defaultAmount = 300000;

          for (let m = startMonth; m <= 12; m++) {
            const dbRecord = payments.find(p => p.bulan === m);
            if (dbRecord) {
              paymentsList.push(dbRecord);
              if (dbRecord.status !== 'LUNAS') {
                if (getMockIsMonthDue(m, targetTahun)) {
                  totalTunggakan += dbRecord.jumlah;
                  unpaidMonths++;
                }
              }
            } else {
              paymentsList.push({
                id: null,
                santriId: targetId,
                bulan: m,
                tahun: targetTahun,
                status: 'BELUM_BAYAR',
                tanggalBayar: null,
                jumlah: defaultAmount
              });
              if (getMockIsMonthDue(m, targetTahun)) {
                totalTunggakan += defaultAmount;
                unpaidMonths++;
              }
            }
          }

          if (userSelect && (userSelect.isBeasiswa === true || userSelect.isBeasiswa === 'true')) {
            totalTunggakan = 0;
            unpaidMonths = 0;
          }

          return resolve({
            user: userSelect,
            akademik: nilai,
            keamanan: sanksi,
            keuangan: {
              tahun: targetTahun,
              totalTunggakan,
              unpaidMonths,
              payments: paymentsList
            }
          });
        }

        // 20b. ROUTING: /users/:id/profile (PUT)
        if (url.startsWith('/users/') && url.endsWith('/profile') && method.toLowerCase() === 'put') {
          const targetId = parseInt(url.split('/')[2]);
          if (currentUser.role !== 'ADMIN' && currentUser.id !== targetId) {
            return reject({ message: 'Unauthorized' });
          }

          const users = getMockData('mock_users');
          const idx = users.findIndex(u => u.id === targetId);
          if (idx === -1) return reject({ message: 'User tidak ditemukan' });

          const { nama, email, password, noHp, alamat, namaWali } = data;

          if (email && email !== users[idx].email) {
            if (users.some(u => u.email === email && u.id !== targetId)) {
              return reject({ message: 'Email sudah terdaftar oleh pengguna lain' });
            }
          }

           const santriBefore = { ...users[idx] };

          if (nama) users[idx].nama = nama;
          if (email !== undefined) users[idx].email = email || null;
          if (noHp !== undefined) users[idx].noHp = noHp;
          if (alamat !== undefined) users[idx].alamat = alamat;
          if (namaWali !== undefined) users[idx].namaWali = namaWali;
          if (password) users[idx].password = password;

          // Hanya admin yang boleh mengubah kelas, status, dan beasiswa
          if (currentUser.role === 'ADMIN') {
            if (data.kelas !== undefined) users[idx].kelas = data.kelas;
            if (data.status !== undefined) users[idx].status = data.status;
            if (data.isBeasiswa !== undefined) users[idx].isBeasiswa = data.isBeasiswa === true || data.isBeasiswa === 'true';
          }

          saveMockData('mock_users', users);

          // Deteksi field yang diubah untuk notifikasi admin (kecuali password)
          const changedFields = [];
          if (nama && nama !== santriBefore.nama) changedFields.push('Nama');
          if (alamat !== undefined && alamat !== santriBefore.alamat) changedFields.push('Alamat');
          if (noHp !== undefined && noHp !== santriBefore.noHp) changedFields.push('No HP');
          if (email !== undefined && email !== santriBefore.email) changedFields.push('Email');
          if (namaWali !== undefined && namaWali !== santriBefore.namaWali) changedFields.push('Wali');

          if (changedFields.length > 0 && currentUser.role !== 'ADMIN') {
            const notifs = getMockData('mock_notifications');
            
            // 1. Notifikasi untuk santri yang bersangkutan (hanya dia yang melihat)
            notifs.push({
              id: Date.now(),
              judul: 'Profil Anda Berhasil Diperbarui',
              isi: `Anda telah berhasil mengubah ${changedFields.join(', ')} pada profil Anda.`,
              kategori: 'UMUM',
              santriId: targetId,
              isRead: false,
              createdAt: new Date().toISOString()
            });

            // 2. Notifikasi khusus admin (santriId: -1 sebagai penanda notifikasi admin-only)
            notifs.push({
              id: Date.now() + 1,
              judul: `Perubahan Profil Santri: ${users[idx].nama}`,
              isi: `Santri ${users[idx].nama} (Kelas: ${users[idx].kelas || '-'}) telah mengubah ${changedFields.join(', ')}.`,
              kategori: 'UMUM',
              santriId: -1,
              isRead: false,
              createdAt: new Date().toISOString()
            });

            saveMockData('mock_notifications', notifs);
          }

          // Sinkronkan token jika user yang diedit adalah user yang sedang login
          if (currentUser.id === targetId) {
            const { password: _p, ...safeUser } = users[idx];
            sessionStorage.setItem('simesra_token', JSON.stringify(safeUser));
          }

          const { password: _p, ...safeUser } = users[idx];
          return resolve({
            message: 'Profil berhasil diperbarui',
            user: safeUser
          });
        }

        // 21a. ROUTING: /notifications (GET)
        if (url === '/notifications' && method.toLowerCase() === 'get') {
          if (!currentUser) return reject({ message: 'Unauthorized' });
          const notifs = getMockData('mock_notifications');
          
          if (currentUser.role === 'ADMIN') {
            return resolve(notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          } else {
            // Get database notifications
            const dbNotifications = notifs.filter(n => n.santriId === null || n.santriId === currentUser.id);

            // Injeksi sanksi dinamis
            const sanksi = getMockData('mock_sanksi').filter(s => s.santriId === currentUser.id);
            const dynamicNotifs = [];

            sanksi.forEach(s => {
              dynamicNotifs.push({
                id: `sanksi-${s.id}`,
                judul: `Catatan Pelanggaran Baru (${s.kategori})`,
                isi: `Tercatat pelanggaran kedisiplinan keamanan pada tanggal ${s.tanggalPelanggaran}: "${s.deskripsi}". Harap tidak mengulangi tindakan ini lagi.`,
                kategori: "KEAMANAN",
                santriId: currentUser.id,
                isRead: false,
                createdAt: s.tanggalPelanggaran
              });
            });

            // Injeksi tunggakan SPP Syariah dinamis
            const isScholar = currentUser.isBeasiswa === true || currentUser.isBeasiswa === 'true';
            if (!isScholar) {
              const unpaidMonths = [];
              const masuk = currentUser.tanggalMasuk ? new Date(currentUser.tanggalMasuk) : new Date(currentUser.createdAt);
              const startYear = masuk.getFullYear();
              const startMonth = masuk.getMonth() + 1;

              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth() + 1;

              const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
              const mockPayments = getMockData('mock_pembayaran').filter(p => p.santriId === currentUser.id);

              for (let y = startYear; y <= currentYear; y++) {
                const mStart = (y === startYear) ? startMonth : 1;
                const mEnd = (y === currentYear) ? currentMonth : 12;

                for (let m = mStart; m <= mEnd; m++) {
                  const isPaid = mockPayments.some(p => p.tahun === y && p.bulan === m && p.status === 'LUNAS');
                  if (!isPaid) {
                    const dbRecord = mockPayments.find(p => p.tahun === y && p.bulan === m);
                    const amount = dbRecord ? dbRecord.jumlah : 300000;
                    unpaidMonths.push({
                      nama: `${namaBulan[m]} ${y}`,
                      jumlah: amount
                    });
                  }
                }
              }

              if (unpaidMonths.length > 0) {
                const totalTunggakan = unpaidMonths.reduce((sum, p) => sum + p.jumlah, 0);
                const listBulan = unpaidMonths.map(p => p.nama).join(', ');

                dynamicNotifs.push({
                  id: `spp-warning-${currentUser.id}`,
                  judul: "Pemberitahuan Tagihan Syariah Bulanan",
                  isi: `Assalamu'alaikum Wr. Wb. Harap melakukan pembayaran Syariah Bulanan sebesar Rp ${totalTunggakan.toLocaleString('id-ID')} untuk bulan: ${listBulan}. Silakan lakukan pembayaran ke bendahara.`,
                  kategori: "SPP",
                  santriId: currentUser.id,
                  isRead: false,
                  createdAt: new Date().toISOString()
                });
              }
            }

            const allNotifs = [...dynamicNotifs, ...dbNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return resolve(allNotifs);
          }
        }

        // 21b. ROUTING: /notifications (POST)
        if (url === '/notifications' && method.toLowerCase() === 'post') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const { judul, isi, kategori, santriId } = data;
          const notifs = getMockData('mock_notifications');

          const newNotif = {
            id: Date.now(),
            judul,
            isi,
            kategori,
            santriId: santriId ? parseInt(santriId) : null,
            isRead: false,
            createdAt: new Date().toISOString()
          };

          notifs.push(newNotif);
          saveMockData('mock_notifications', notifs);

          return resolve({ message: 'Notifikasi berhasil dikirim', notification: newNotif });
        }

        // 21c. ROUTING: /notifications/:id (DELETE)
        if (url.startsWith('/notifications/') && method.toLowerCase() === 'delete') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const id = parseInt(url.split('/')[2]);
          let notifs = getMockData('mock_notifications');
          notifs = notifs.filter(n => n.id !== id);
          saveMockData('mock_notifications', notifs);
          return resolve({ message: 'Notifikasi berhasil dihapus' });
        }

        // 21d. ROUTING: /notifications/read (PUT)
        if (url === '/notifications/read' && method.toLowerCase() === 'put') {
          if (!currentUser) return reject({ message: 'Unauthorized' });
          const { id } = data || {};
          const notifs = getMockData('mock_notifications');

          if (id) {
            const idx = notifs.findIndex(n => n.id === id && n.santriId === currentUser.id);
            if (idx !== -1) {
              notifs[idx].isRead = true;
            }
          } else {
            notifs.forEach(n => {
              if (n.santriId === currentUser.id) {
                n.isRead = true;
              }
            });
          }

          saveMockData('mock_notifications', notifs);
          return resolve({ message: 'Notifikasi ditandai dibaca' });
        }

        // Default error
        reject({ message: 'Endpoint demo tidak ditemukan' });
      } catch (err) {
        console.error('Mock error:', err);
        reject({ message: 'Kesalahan sistem demo' });
      }
    }, 100); // Latency simulator 100ms
  });
};

export default {
  get: (url, config) => request('get', url, null, config?.params),
  post: (url, data) => request('post', url, data),
  put: (url, data) => request('put', url, data),
  delete: (url) => request('delete', url),
};
