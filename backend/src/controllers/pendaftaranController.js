const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper untuk normalisasi string (menghapus gelar, spasi ganda, tanda baca, huruf kecil)
const normalizeName = (name) => {
  if (!name) return '';
  let str = name.toLowerCase().trim();
  // Hapus karakter non-alphanumerik kecuali spasi
  str = str.replace(/[^a-z0-9\s]/g, '');
  // Hapus kata depan umum/singkatan yang sering berbeda
  const removeWords = ['muhammad', 'muh', 'md', 'm', 'al', 'bin', 'binti', 'siti'];
  let words = str.split(/\s+/).filter(w => w.length > 0);
  let filtered = words.filter(w => !removeWords.includes(w));
  // Jika semua kata terhapus (misal namanya cuma "Muhammad"), pakai kata asli
  return filtered.length > 0 ? filtered.join(' ') : words.join(' ');
};

// Logika pencocokan cerdas antara Pendaftaran dengan Data Santri yang sudah ada
const findMatchingSantri = (pendaftar, santriList) => {
  const normRegName = normalizeName(pendaftar.nama);
  if (!normRegName) return null;

  // 1. Coba pencocokan NIS jika diisi
  if (pendaftar.nis) {
    const nisNum = parseInt(pendaftar.nis);
    if (!isNaN(nisNum)) {
      const matchByNis = santriList.find(s => s.id === nisNum);
      if (matchByNis) return matchByNis;
    }
  }

  // 2. Pencocokan Nama Eksak (Exact Normalized Match)
  const exactMatch = santriList.find(s => normalizeName(s.nama) === normRegName);
  if (exactMatch) return exactMatch;

  // 3. Pencocokan Kemiripan Nama (Fuzzy / Substring Match)
  const regWords = normRegName.split(' ');
  for (const s of santriList) {
    const sNorm = normalizeName(s.nama);
    const sWords = sNorm.split(' ');

    // Cek jika salah satu nama mengandung nama lainnya (misal: "Rifki Ahmad" vs "Rifki Ahmad Dzulfikri")
    if (sNorm.includes(normRegName) || normRegName.includes(sNorm)) {
      return s;
    }

    // Cek jika lebih dari 70% kata cocok
    if (regWords.length > 1 && sWords.length > 1) {
      const matchedWords = regWords.filter(w => sWords.includes(w));
      if (matchedWords.length >= Math.ceil(regWords.length * 0.7)) {
        return s;
      }
    }
  }

  return null;
};

// PUBLIC: Cek Ketersediaan Email & Validasi Domain Real-time
const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.trim()) {
      return res.status(400).json({ validDomain: false, available: false, message: 'Alamat email wajib diisi' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validasi domain @pesantren.com
    if (!cleanEmail.endsWith('@pesantren.com')) {
      return res.json({
        validDomain: false,
        available: false,
        message: 'Email harus menggunakan domain @pesantren.com. Contoh: nama@pesantren.com'
      });
    }

    // Cek duplikasi di User, Santri, dan Pendaftaran
    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    const existingSantri = await prisma.santri.findFirst({ where: { email: cleanEmail } });
    const existingPending = await prisma.pendaftaran.findFirst({ 
      where: { 
        email: cleanEmail,
        status: { in: ['PENDING', 'APPROVED'] }
      } 
    });

    if (existingUser || existingSantri || existingPending) {
      return res.json({
        validDomain: true,
        available: false,
        message: 'Alamat email ini sudah digunakan oleh akun lain. Silakan gunakan alamat email yang berbeda.'
      });
    }

    return res.json({
      validDomain: true,
      available: true,
      message: 'Alamat email tersedia'
    });
  } catch (error) {
    console.error('Check email availability error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengecek ketersediaan email' });
  }
};

// 1. PUBLIC: Pendaftaran Akun Mandiri
const register = async (req, res) => {
  try {
    const { nama, email, password, noHp, alamat, namaWali } = req.body;

    if (!nama || !nama.trim()) {
      return res.status(400).json({ message: 'Nama lengkap wajib diisi' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Alamat email wajib diisi' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validasi domain @pesantren.com
    if (!cleanEmail.endsWith('@pesantren.com')) {
      return res.status(400).json({ message: 'Email harus menggunakan domain @pesantren.com. Contoh: nama@pesantren.com' });
    }

    if (!noHp || !noHp.trim()) {
      return res.status(400).json({ message: 'Nomor HP/WhatsApp wajib diisi' });
    }

    if (!alamat || !alamat.trim()) {
      return res.status(400).json({ message: 'Alamat lengkap wajib diisi' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Kata sandi minimal 6 karakter' });
    }

    // Cek keunikan email di User, Santri, dan Pendaftaran
    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    const existingSantri = await prisma.santri.findFirst({ where: { email: cleanEmail } });
    const existingPending = await prisma.pendaftaran.findFirst({ 
      where: { 
        email: cleanEmail,
        status: { in: ['PENDING', 'APPROVED'] }
      } 
    });

    if (existingUser || existingSantri || existingPending) {
      return res.status(400).json({ message: 'Alamat email ini sudah digunakan oleh akun lain. Silakan gunakan alamat email yang berbeda.' });
    }

    // Hash kata sandi
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat Pendaftaran Baru
    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        nama: nama.trim(),
        email: cleanEmail,
        password: hashedPassword,
        noHp: noHp.trim(),
        alamat: alamat.trim(),
        role: 'SANTRI',
        namaWali: namaWali ? namaWali.trim() : null,
        status: 'PENDING'
      }
    });

    // Buat Notifikasi ke Admin (santriId: -1)
    await prisma.notification.create({
      data: {
        judul: 'Pendaftaran Akun Baru',
        isi: `Pendaftaran akun baru dari ${nama.trim()} (${cleanEmail}). Mohon lakukan peninjauan pada menu Persetujuan Akun.`,
        kategori: 'UMUM',
        santriId: -1
      }
    });

    res.status(201).json({
      message: 'Pendaftaran berhasil dikirim. Akun Anda akan aktif setelah disetujui oleh Admin. Mohon tunggu konfirmasi.',
      pendaftaranId: pendaftaran.id
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat proses pendaftaran' });
  }
};

// 2. ADMIN: Ambil Semua Daftar Pendaftaran + Status Match
const getPendaftaranList = async (req, res) => {
  try {
    const list = await prisma.pendaftaran.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const allSantri = await prisma.santri.findMany({
      select: { id: true, nama: true, email: true, kelas: true, namaWali: true, alamat: true, status: true }
    });

    const enrichedList = list.map(item => {
      const matchedSantri = findMatchingSantri(item, allSantri);
      return {
        ...item,
        suggestedMatch: matchedSantri ? {
          id: matchedSantri.id,
          nama: matchedSantri.nama,
          kelas: matchedSantri.kelas || '-',
          email: matchedSantri.email,
          namaWali: matchedSantri.namaWali,
          alamat: matchedSantri.alamat
        } : null
      };
    });

    res.json(enrichedList);
  } catch (error) {
    console.error('Get pendaftaran list error:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar pendaftaran akun' });
  }
};

// 3. ADMIN: ACC / Setujui Pendaftaran
const approvePendaftaran = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { force } = req.body; // force = true jika admin mengabaikan peringatan tidak ada match

    const item = await prisma.pendaftaran.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan' });
    }

    if (item.status === 'APPROVED') {
      return res.status(400).json({ message: 'Pendaftaran ini sudah disetujui sebelumnya' });
    }

    const allSantri = await prisma.santri.findMany();
    const matchedSantri = findMatchingSantri(item, allSantri);

    // Jika tidak ada santri yang cocok dan admin belum mengonfirmasi 'force'
    if (!matchedSantri && !force) {
      return res.status(200).json({
        warning: true,
        message: `Nama '${item.nama}' tidak ditemukan dalam data santri terdaftar. Pastikan data santri sudah diinput terlebih dahulu, atau lanjutkan approve sebagai akun tanpa tautan data santri.`,
        item
      });
    }

    let linkedSantriId = null;

    if (matchedSantri) {
      // Tautkan & Update Data Santri yang sudah ada
      await prisma.santri.update({
        where: { id: matchedSantri.id },
        data: {
          email: item.email,
          password: item.password, // Password hashed dari pendaftaran
          noHp: item.noHp || matchedSantri.noHp,
          alamat: item.alamat || matchedSantri.alamat,
          namaWali: item.namaWali || matchedSantri.namaWali,
          status: 'ACTIVE'
        }
      });
      linkedSantriId = matchedSantri.id;

      // Kirim Notifikasi ke Santri bersangkutan
      await prisma.notification.create({
        data: {
          judul: 'Akun Anda Berhasil Disetujui',
          isi: `Selamat! Akun Anda (${item.email}) telah aktif dan terhubung langsung dengan data santri atas nama ${matchedSantri.nama}.`,
          kategori: 'UMUM',
          santriId: matchedSantri.id
        }
      });
    } else {
      // Tidak ada match tetapi dikonfirmasi 'force' oleh admin
      const newSantri = await prisma.santri.create({
        data: {
          nama: item.nama,
          email: item.email,
          password: item.password,
          noHp: item.noHp,
          alamat: item.alamat,
          namaWali: item.namaWali,
          status: 'ACTIVE'
        }
      });
      linkedSantriId = newSantri.id;
    }

    // Update status pendaftaran menjadi APPROVED
    await prisma.pendaftaran.update({
      where: { id },
      data: {
        status: 'APPROVED',
        matchedSantriId: linkedSantriId
      }
    });

    res.json({
      message: `Pendaftaran akun '${item.nama}' telah berhasil disetujui!`,
      linkedSantriId
    });
  } catch (error) {
    console.error('Approve pendaftaran error:', error);
    res.status(500).json({ message: 'Gagal menyetujui pendaftaran akun' });
  }
};

// 4. ADMIN: Tolak Pendaftaran
const rejectPendaftaran = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { alasanPenolakan } = req.body;

    const item = await prisma.pendaftaran.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan' });
    }

    await prisma.pendaftaran.update({
      where: { id },
      data: {
        status: 'REJECTED',
        alasanPenolakan: alasanPenolakan || 'Pendaftaran tidak disetujui oleh Admin.'
      }
    });

    res.json({
      message: `Pendaftaran akun '${item.nama}' telah ditolak.`
    });
  } catch (error) {
    console.error('Reject pendaftaran error:', error);
    res.status(500).json({ message: 'Gagal menolak pendaftaran akun' });
  }
};

module.exports = {
  checkEmailAvailability,
  register,
  getPendaftaranList,
  approvePendaftaran,
  rejectPendaftaran
};
