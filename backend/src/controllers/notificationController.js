const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'ADMIN') {
      // Admin melihat semua pengumuman/notifikasi yang pernah dibuat oleh admin
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(notifications);
    } else {
      // Santri melihat notifikasi yang dikirim untuk semua (null) atau spesifik untuk dirinya (userId)
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
        const tunggakanPayments = santri.pembayaran.filter(p => p.status === 'BELUM_BAYAR');
        if (tunggakanPayments.length > 0) {
          const totalTunggakan = tunggakanPayments.reduce((sum, p) => sum + p.jumlah, 0);
          const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          const listBulan = tunggakanPayments.map(p => `${namaBulan[p.bulan]} ${p.tahun}`).join(', ');
          
          dynamicNotifications.push({
            id: `spp-warning-${userId}`,
            judul: "Pemberitahuan Tunggakan Syariah Bulanan",
            isi: `Assalamu'alaikum Wr. Wb. Harap segera melunasi iuran Syariah Bulanan sebesar Rp ${totalTunggakan.toLocaleString('id-ID')} untuk bulan: ${listBulan}. Silakan lakukan pembayaran ke bendahara.`,
            kategori: "SPP",
            santriId: userId,
            isRead: false,
            createdAt: new Date()
          });
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
            judul: `Catatan Pelanggaran Baru (${s.kategori})`,
            isi: `Tercatat pelanggaran kedisiplinan keamanan pada tanggal ${formattedDate}: "${s.deskripsi}". Harap tidak mengulangi tindakan ini lagi.`,
            kategori: "KEAMANAN",
            santriId: userId,
            isRead: false,
            createdAt: s.tanggalPelanggaran
          });
        });
      }

      // Gabungkan notifikasi database dengan notifikasi dinamis, urutkan berdasarkan tanggal terbaru
      const allNotifications = [...dynamicNotifications, ...dbNotifications].sort((a, b) => {
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

module.exports = {
  getNotifications,
  createNotification,
  deleteNotification,
  markAsRead
};
