import axios from 'axios';

// Konfigurasi base Axios
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});


// Interceptor untuk menyisipkan token JWT di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('simesra_token');
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
      { id: 1, santriId: 2, bulan: 1, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-01-05', jumlah: 250000 },
      { id: 2, santriId: 2, bulan: 2, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-02-04', jumlah: 250000 },
      { id: 3, santriId: 2, bulan: 3, tahun: 2026, status: 'BELUM_BAYAR', tanggalBayar: null, jumlah: 250000 },
      { id: 4, santriId: 2, bulan: 4, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-04-06', jumlah: 250000 },
      { id: 5, santriId: 3, bulan: 1, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-01-08', jumlah: 250000 },
      { id: 6, santriId: 3, bulan: 2, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-02-07', jumlah: 250000 },
      { id: 7, santriId: 3, bulan: 3, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-03-05', jumlah: 250000 },
      { id: 8, santriId: 3, bulan: 4, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-04-04', jumlah: 250000 },
      { id: 9, santriId: 3, bulan: 5, tahun: 2026, status: 'LUNAS', tanggalBayar: '2026-05-02', jumlah: 250000 }
    ];

    localStorage.setItem('mock_users', JSON.stringify(users));
    localStorage.setItem('mock_nilai', JSON.stringify(nilai));
    localStorage.setItem('mock_sanksi', JSON.stringify(sanksi));
    localStorage.setItem('mock_pembayaran', JSON.stringify(pembayaran));
    localStorage.setItem('db_initialized_v5', 'true');
  }
};

// Panggil inisialisasi database localstorage
seedMockDatabase();

// Helper get database dari localStorage
const getMockData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const saveMockData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Cek siapa user yang sedang login berdasarkan token
const getLoggedInUser = () => {
  const token = localStorage.getItem('simesra_token');
  if (!token) return null;
  try {
    // Di demo mode, token hanyalah JSON string user
    return JSON.parse(token);
  } catch (e) {
    return null;
  }
};

// Buat wrapper request API
const request = async (method, url, data = null, params = null) => {
  // Cek apakah server mati / kita menggunakan mock db
  const useMock = localStorage.getItem('use_mock_db') === 'true' || window.useMockDb === true;

  if (!useMock) {
    try {
      // Coba panggil server backend asli
      const response = await api({ method, url, data, params });
      return response.data;
    } catch (error) {
      // Hanya alihkan ke mock mode jika terjadi Network Error (tidak ada response) 
      // atau Server Error (status >= 500)
      const isNetworkError = !error.response;
      const isServerError = error.response && error.response.status >= 500;

      if (isNetworkError || isServerError) {
        console.warn('Backend tidak tersedia. Mengaktifkan Mode Demo...', error?.message || error);
        localStorage.setItem('use_mock_db', 'true');
        window.useMockDb = true;
        // Panggil ulang secara rekursif - kali ini akan masuk ke mock
        return request(method, url, data, params);
      }
      
      // Jika ini adalah error client (400, 401, 403, 404, dll), lempar error aslinya
      // agar ditangani oleh halaman/komponen pemanggil
      throw error.response && error.response.data ? error.response.data : error;
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
          localStorage.setItem('simesra_token', JSON.stringify(found));
          return resolve({ message: 'Login berhasil (Demo)', token: JSON.stringify(found), user: found });
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
          localStorage.setItem('simesra_token', JSON.stringify(userForToken));
          // Return tanpa password
          const { password, ...safeUser } = latestUser;
          return resolve(safeUser);
        }

        // 4. ROUTING: /admin/stats
        if (url === '/admin/stats' && method.toLowerCase() === 'get') {
          if (!currentUser || currentUser.role !== 'ADMIN') return reject({ message: 'Unauthorized' });
          const users = getMockData('mock_users').filter(u => u.role === 'SANTRI');
          const sanksi = getMockData('mock_sanksi');
          const pembayaran = getMockData('mock_pembayaran');

          const activeCount = users.filter(u => u.status === 'ACTIVE').length;
          const pendingCount = users.filter(u => u.status === 'PENDING').length;
          
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

          return resolve({
            totalSantri: users.length,
            activeSantri: activeCount,
            pendingSantri: pendingCount,
            totalSanksi: sanksi.length,
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
            users = users.filter(u => 
              u.nama.toLowerCase().includes(search.toLowerCase()) || 
              (u.kelas && u.kelas.toLowerCase().includes(search.toLowerCase()))
            );
          }
          if (kelas) {
            users = users.filter(u => u.kelas === kelas);
          }
          return resolve(users);
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
            localStorage.setItem('simesra_token', JSON.stringify(users[idx]));
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
            jumlah: jumlah !== undefined ? parseFloat(jumlah) : 250000
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
          const defaultAmount = 250000;

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
          
          const paymentsList = [];
          let totalTunggakan = 0;
          const defaultAmount = 250000;

          for (let m = 1; m <= 12; m++) {
            const dbRecord = payments.find(p => p.bulan === m);
            if (dbRecord) {
              paymentsList.push(dbRecord);
              if (dbRecord.status !== 'LUNAS') totalTunggakan += dbRecord.jumlah;
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
            user: userSelect,
            akademik: nilai,
            keamanan: sanksi,
            keuangan: {
              tahun: targetTahun,
              totalTunggakan,
              payments: paymentsList
            }
          });
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
