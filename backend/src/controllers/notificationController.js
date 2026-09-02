const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const admin = require('../firebase');
const { getMessaging } = require('firebase-admin/messaging');


const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'ADMIN') {
      // Admin hanya melihat notifikasi global (santriId = null) dan notifikasi khusus admin (santriId = -1)
      // Notifikasi khusus santri individual (santriId > 0) TIDAK dimunculkan di lonceng admin
      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { santriId: null },
            { santriId: -1 }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(notifications);
    } else {
      // Santri melihat notifikasi yang dikirim untuk semua (null) atau spesifik untuk dirinya (userId)
      // Notifikasi admin-only (santriId: -1) TIDAK ditampilkan ke santri
      const dbNotifications = await prisma.notification.findMany({
        where: {
          OR: [
            { santriId: null },
            { santriId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      // Ambil data santri untuk membuat notifikasi dinamis
      const santri = await prisma.santri.findUnique({
        where: { id: userId },
        include: {
          sanksi: true,
          pembayaran: true
        }
      });

      const dynamicNotifications = [];

      if (santri) {
        // 1. Notifikasi Tunggakan SPP Syariah Bulanan (Keuangan)
        // Dikecualikan untuk penerima beasiswa
        const isScholar = santri.isBeasiswa === true || santri.isBeasiswa === 'true';
        if (!isScholar) {
          const unpaidMonths = [];
          const masuk = santri.tanggalMasuk ? new Date(santri.tanggalMasuk) : new Date(santri.createdAt);
          const startYear = masuk.getFullYear();
          const startMonth = masuk.getMonth() + 1;

          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;

          const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

          for (let y = startYear; y <= currentYear; y++) {
            const mStart = (y === startYear) ? startMonth : 1;
            const mEnd = (y === currentYear) ? currentMonth : 12;

            for (let m = mStart; m <= mEnd; m++) {
              const isPaid = santri.pembayaran.some(p => p.tahun === y && p.bulan === m && p.status === 'LUNAS');
              if (!isPaid) {
                const dbRecord = santri.pembayaran.find(p => p.tahun === y && p.bulan === m);
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
            
            dynamicNotifications.push({
              id: `spp-warning-${userId}`,
              judul: "Pemberitahuan Tagihan Syariah Bulanan",
              isi: `Assalamu'alaikum Wr. Wb. Harap melakukan pembayaran Syariah Bulanan sebesar Rp ${totalTunggakan.toLocaleString('id-ID')} untuk bulan: ${listBulan}. Silakan lakukan pembayaran ke bendahara.`,
              kategori: "SPP",
              santriId: userId,
              isRead: false,
              createdAt: new Date(now.getFullYear(), now.getMonth(), 1)
            });
          }
        }

        // 2. Notifikasi Pelanggaran Sanksi (Keamanan)
        santri.sanksi.forEach(s => {
          const formattedDate = new Date(s.tanggalPelanggaran).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          dynamicNotifications.push({
            id: `sanksi-${s.id}`,
            judul: `Catatan Pelanggaran (${s.kategori})`,
            isi: `Tercatat pelanggaran kedisiplinan keamanan pada tanggal ${formattedDate}: "${s.deskripsi}". Harap tidak mengulangi tindakan ini lagi.`,
            kategori: "KEAMANAN",
            santriId: userId,
            isRead: false,
            // Gunakan createdAt DB (kapan dicatat), bukan tanggalPelanggaran
            createdAt: s.createdAt
          });
        });
      }

      // Gabungkan: DB notifications DULU (lebih prioritas/akurat waktu), lalu dynamic
      // Sort by createdAt descending - notifikasi DB terbaru akan di atas
      const allNotifications = [...dbNotifications, ...dynamicNotifications].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return res.json(allNotifications);
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Gagal memuat notifikasi' });
  }
};

const createNotification = async (req, res) => {
  try {
    const { judul, isi, kategori, santriId } = req.body;

    if (!judul || !isi || !kategori) {
      return res.status(400).json({ message: 'Judul, isi, dan kategori wajib diisi' });
    }

    const newNotification = await prisma.notification.create({
      data: {
        judul,
        isi,
        kategori,
        santriId: santriId ? parseInt(santriId) : null,
        isRead: false
      }
    });

    // Kirim notifikasi push ke Firebase jika ini pengumuman global (santriId null)
    if (!santriId) {
      try {
        // Kirim data-only message agar onMessageReceived SELALU dipanggil
        // (bahkan saat app sedang tertutup/killed), memberikan kontrol penuh atas suara notifikasi
        await getMessaging().send({
          topic: 'global_announcements',
          // TANPA key 'notification' = data-only message
          data: {
            title: judul,
            body: isi,
            kategori: kategori
          },
          android: {
            priority: 'high',  // Prioritas tinggi agar HP "bangun" meski dalam mode hemat baterai
            ttl: 3600 * 1000   // Pesan berlaku 1 jam
          }
        });
        console.log('Firebase Push Notification (data-only) sent successfully to global_announcements');
      } catch (fcmError) {
        console.error('Error sending Firebase Push Notification:', fcmError);
        // Kita tidak mereturn error agar proses database tetap sukses meskipun push gagal
      }
    }

    res.status(201).json({
      message: 'Notifikasi berhasil dikirim',
      notification: newNotification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Gagal membuat notifikasi' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if notification exists
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }

    // Jika yang dihapus adalah notifikasi admin tentang perubahan profil santri,
    // cari dan hapus juga notifikasi pasangannya di sisi santri (dibuat di waktu yang sama)
    if (notification.santriId === -1 && notification.judul && notification.judul.startsWith('Perubahan Profil Santri:')) {
      try {
        const timeLimitStart = new Date(new Date(notification.createdAt).getTime() - 10000); // 10 detik sebelum
        const timeLimitEnd = new Date(new Date(notification.createdAt).getTime() + 10000);   // 10 detik sesudah
        
        const relatedNotif = await prisma.notification.findFirst({
          where: {
            judul: 'Profil Anda Berhasil Diperbarui',
            createdAt: {
              gte: timeLimitStart,
              lte: timeLimitEnd
            },
            santriId: {
              notIn: [null, -1] // bukan global dan bukan admin
            }
          }
        });

        if (relatedNotif) {
          await prisma.notification.delete({
            where: { id: relatedNotif.id }
          });
        }
      } catch (innerError) {
        console.error('Gagal menghapus notifikasi santri terkait:', innerError);
      }
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Notifikasi berhasil dihapus' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Gagal menghapus notifikasi' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user.id;

    if (id) {
      // Menandai satu notifikasi spesifik sebagai dibaca
      const notification = await prisma.notification.findFirst({
        where: {
          id: parseInt(id),
          santriId: userId
        }
      });

      if (notification) {
        await prisma.notification.update({
          where: { id: parseInt(id) },
          data: { isRead: true }
        });
      }
    } else {
      // Menandai semua notifikasi personal sebagai dibaca
      await prisma.notification.updateMany({
        where: {
          santriId: userId,
          isRead: false
        },
        data: { isRead: true }
      });
    }

    res.json({ message: 'Notifikasi berhasil ditandai dibaca' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Gagal memperbarui status notifikasi' });
  }
};

const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, isi, kategori, santriId } = req.body;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    }

    const updated = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        judul: judul !== undefined ? judul : notification.judul,
        isi: isi !== undefined ? isi : notification.isi,
        kategori: kategori !== undefined ? kategori : notification.kategori,
        santriId: santriId !== undefined ? (santriId ? parseInt(santriId) : null) : notification.santriId,
      }
    });

    res.json({ message: 'Notifikasi berhasil diperbarui', notification: updated });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ message: 'Gagal memperbarui notifikasi' });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead
};
