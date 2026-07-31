import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  ShieldAlert, 
  Search, 
  Check, 
  Eye, 
  EyeOff,
  Trash2, 
  Edit, 
  AlertTriangle,
  ArrowRight,
  BookOpen,
  DollarSign,
  Sparkles,
  Award,
  Database,
  RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import { confirmDialog, alertDialog } from '../utils/dialog';

function Dashboard({ user }) {
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const [stats, setStats] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateStatus, setMigrateStatus] = useState('');

  // State untuk paginasi santri
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk modal edit santri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // State untuk data santri (jika login sebagai Santri)
  const [mySummary, setMySummary] = useState(null);

  useEffect(() => {
    if (user.role === 'ADMIN') {
      fetchAdminData();
    } else {
      fetchSantriData();
    }

    const handleRefresh = () => {
      if (user.role === 'ADMIN') fetchAdminData();
      else fetchSantriData();
    };

    // Auto-refresh ketika app aktif kembali dari background (misal diklik dari panel notifikasi)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (user.role === 'ADMIN') fetchAdminData();
        else fetchSantriData();
      }
    };

    window.addEventListener('refreshData', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('refreshData', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [search, filterKelas, user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterKelas]);

  const fetchAdminData = async () => {
    try {
      const statsData = await api.get('/admin/stats');
      setStats(statsData);

      const list = await api.get('/admin/santri', { 
        params: { search, kelas: filterKelas } 
      });
      setSantriList(list);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data dashboard admin');
    } finally {
      setLoading(false);
    }
  };

  const fetchSantriData = async () => {
    try {
      const profileData = await api.get(`/users/${user.id}/profile`);
      const notifData = await api.get('/notifications');
      
      // Hitung ringkasan
      const totalNilai = profileData.akademik.length;
      const avgNilai = totalNilai > 0
        ? (profileData.akademik.reduce((sum, n) => sum + ((n.nilaiUts + n.nilaiUas) / 2), 0) / totalNilai).toFixed(1)
        : '0';

      setMySummary({
        user: profileData.user,
        avgNilai,
        sanksiCount: profileData.keamanan.length,
        tunggakan: profileData.keuangan.totalTunggakan,
        unpaidMonths: profileData.keuangan.payments.filter(p => p.status === 'BELUM_BAYAR').length,
        // Tampilkan semua notifikasi dari DB (dari admin), bukan hanya UMUM & UJIAN
        notifications: notifData.filter(n => typeof n.id === 'number')
      });
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data ringkasan santri');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, nama) => {
    if (!await confirmDialog(`Aktifkan akun santri ${nama}?`)) return;
    try {
      await api.put(`/admin/users/${id}/verify`);
      fetchAdminData();
    } catch (err) {
      alertDialog(err.message || 'Gagal mengaktifkan akun', 'Gagal');
    }
  };

  const handleDelete = async (id, nama) => {
    if (!await confirmDialog(`PERINGATAN: Menghapus data santri "${nama}" akan menghapus seluruh data nilai, sanksi, dan keuangan Syariah yang bersangkutan. Lanjutkan?`)) return;
    try {
      await api.delete(`/admin/santri/${id}`);
      fetchAdminData();
    } catch (err) {
      alertDialog(err.message || 'Gagal menghapus santri', 'Gagal');
    }
  };

  const openEditModal = (santri) => {
    setEditingSantri({ ...santri });
    setIsEditModalOpen(true);
  };

  const handleUpdateSantri = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/santri/${editingSantri.id}`, editingSantri);
      setIsEditModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alertDialog(err.message || 'Gagal memperbarui data santri', 'Gagal');
    }
  };

  const handleMigrateOfflineData = async () => {
    const localUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const localNilai = JSON.parse(localStorage.getItem('mock_nilai') || '[]');
    const localSanksi = JSON.parse(localStorage.getItem('mock_sanksi') || '[]');
    const localPembayaran = JSON.parse(localStorage.getItem('mock_pembayaran') || '[]');

    const offlineSantri = localUsers.filter(u => u.role === 'SANTRI');

    if (offlineSantri.length === 0) {
      alertDialog('Tidak ada data santri offline (demo) yang ditemukan di penyimpanan lokal browser/aplikasi ini.', 'Informasi');
      return;
    }

    const confirmed = await confirmDialog(
      `Ditemukan ${offlineSantri.length} data santri offline (serta nilai/sanksi/SPP terkait). Apakah Anda yakin ingin memigrasikan seluruh data tersebut ke database online Vercel + Neon?`
    );
    if (!confirmed) return;

    setMigrating(true);
    setMigrateStatus('Memulai migrasi...');

    try {
      let migratedCount = 0;
      for (let i = 0; i < offlineSantri.length; i++) {
        const s = offlineSantri[i];
        setMigrateStatus(`Mengunggah santri (${i + 1}/${offlineSantri.length}): ${s.nama}...`);

        // Buat santri di backend
        const santriPayload = {
          nama: s.nama,
          email: s.email || `${s.nama.toLowerCase().replace(/\s+/g, '')}@pesantren.com`,
          password: s.password || 'santri123',
          noHp: s.noHp || '',
          alamat: s.alamat || '',
          namaWali: s.namaWali || '',
          kelas: s.kelas || '',
          isBeasiswa: s.isBeasiswa || false
        };

        const newSantri = await api.post('/admin/santri', santriPayload);
        const newId = newSantri.id;

        // Migrasi Nilai
        const scores = localNilai.filter(n => n.santriId === s.id);
        for (const n of scores) {
          await api.post('/akademik', {
            santriId: newId,
            mataPelajaran: n.mataPelajaran,
            nilaiUts: n.nilaiUts,
            nilaiUas: n.nilaiUas,
            semester: n.semester,
            tahunAjaran: n.tahunAjaran
          });
        }

        // Migrasi Sanksi
        const violations = localSanksi.filter(sk => sk.santriId === s.id);
        for (const sk of violations) {
          await api.post('/keamanan', {
            santriId: newId,
            tanggalPelanggaran: sk.tanggalPelanggaran,
            tahun: sk.tahun,
            deskripsi: sk.deskripsi,
            kategori: sk.kategori
          });
        }

        // Migrasi SPP/Pembayaran
        const payments = localPembayaran.filter(p => p.santriId === s.id);
        for (const p of payments) {
          await api.post('/keuangan', {
            santriId: newId,
            bulan: p.bulan,
            tahun: p.tahun,
            status: p.status,
            jumlah: p.jumlah,
            tanggalBayar: p.tanggalBayar
          });
        }

        migratedCount++;
      }

      setMigrateStatus('');
      alertDialog(`Berhasil memigrasikan ${migratedCount} data santri beserta seluruh nilai, sanksi, dan keuangan terkait ke database online Vercel + Neon!`, 'Migrasi Sukses');
      fetchAdminData();
    } catch (err) {
      console.error('Migration error:', err);
      alertDialog('Gagal memproses migrasi: ' + (err.message || err), 'Gagal Migrasi');
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RENDERING DASHBOARD SANTRI ---
  if (user.role === 'SANTRI') {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#0B4A3F] via-[#083831] to-[#041e1a] text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-[#D4AF37]/30">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E8C766] text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center space-x-1.5">
                <Sparkles size={12} />
                <span>Assalamu'alaikum Wr. Wb.</span>
              </span>
              <h1 className="text-2xl md:text-3xl font-bold font-serif mt-3 text-white">Selamat Datang, {user.nama}</h1>
              <p className="text-emerald-100/90 text-xs md:text-sm mt-1.5 max-w-xl leading-relaxed">
                Pantau perkembangan akademik, riwayat kedisiplinan, serta administrasi pembayaran bulanan Anda melalui SIM Pesantren Miftahul Huda As-Syadzili.
              </p>
            </div>
            <Link 
              to="/profil" 
              className="inline-flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#E8C766] text-[#0B4A3F] font-bold px-5 py-3 rounded-xl transition shadow-lg text-xs self-start md:self-center"
            >
              <span>Lihat Detail Profil</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Notif Wajib Bayar Uang Syariah */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-start space-x-3">
          <div className="text-amber-600 mt-0.5 flex-shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-xs text-amber-800 uppercase tracking-wider">Pemberitahuan Wajib Bayar Uang Syariah</h4>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">
              Diberitahukan kepada seluruh santri untuk wajib membayar <strong>Uang Syariah Bulanan</strong> sebesar Rp 300.000 paling lambat tanggal 10 setiap bulannya. Harap hubungi bendahara atau lakukan pembayaran ke kantor pesantren.
            </p>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Kelas Santri</p>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B4A3F] mt-0.5 break-words">{mySummary?.user.kelas || 'Belum Set'}</h3>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Rata-Rata Nilai</p>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B4A3F] mt-0.5 break-words">{mySummary?.avgNilai} / 100</h3>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Total Pelanggaran</p>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5 break-words">{mySummary?.sanksiCount} Pelanggaran</h3>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DCFCE7] text-[#0B4A3F] flex items-center justify-center flex-shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">Tunggakan Syariah</p>
              <h3 className={`text-sm sm:text-base font-extrabold mt-0.5 break-words ${mySummary?.tunggakan > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                {mySummary?.tunggakan > 0 ? `Rp ${mySummary.tunggakan.toLocaleString('id-ID')}` : 'Lunas'}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick info alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80">
            <h2 className="text-base font-bold text-[#0B4A3F] font-serif mb-4 flex items-center space-x-2">
              <span>📚 Pengumuman Santri</span>
            </h2>
            <div className="space-y-3">
              {mySummary?.notifications && mySummary.notifications.length > 0 ? (
                mySummary.notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#0B4A3F]">{n.judul}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">{n.isi}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-400">
                  <p className="text-xs">Tidak ada pengumuman terbaru</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B4A3F] font-serif mb-3">💳 Status Tagihan Keuangan</h2>
              <p className="text-slate-600 text-xs leading-relaxed">
                Pembayaran Syariah jatuh tempo setiap tanggal 10 tiap bulannya sebesar <strong>Rp 300.000</strong>. Anda memiliki total <strong>{mySummary?.unpaidMonths} bulan</strong> tunggakan di tahun ini.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Link to="/keuangan" className="flex-1 bg-[#0B4A3F] hover:bg-[#083831] text-white text-center py-2.5 font-bold text-xs rounded-xl shadow-sm transition">
                Bayar Syariah / Cek Riwayat
              </Link>
              <Link to="/pendidikan" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center py-2.5 font-bold text-xs rounded-xl transition">
                Lihat Nilai Rapor
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING DASHBOARD ADMIN ---
  return (
    <div className="space-y-6">
      {/* Welcome Banner Admin */}
      <div className="bg-gradient-to-r from-[#0B4A3F] via-[#083831] to-[#041e1a] text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-[#D4AF37]/30">
        <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E8C766] text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center space-x-1.5">
            <Sparkles size={12} className="text-[#E8C766]" />
            <span>Assalamu'alaikum Wr. Wb. • Portal Utama</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif mt-3 text-white">Selamat Datang, {user.nama}</h1>
          <p className="text-emerald-100/90 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Anda masuk sebagai Administrator. Kelola seluruh data santri, konfigurasi kelas/rombel, monitoring keuangan Syariah, and sanksi kedisiplinan secara efisien melalui panel kontrol ini.
          </p>
          

        </div>
      </div>

      {/* Stats Grid dengan Border Top Emas Tipis & Soft Circle Background Icon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Santri */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-3.5 sm:p-5 rounded-2xl shadow-soft card-hover flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
          <div className="order-2 sm:order-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">TOTAL SANTRI TERDAFTAR</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.totalSantri || 0}</h3>
          </div>
          <div className="order-1 sm:order-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* Santri Aktif */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-3.5 sm:p-5 rounded-2xl shadow-soft card-hover flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
          <div className="order-2 sm:order-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">SANTRI STATUS AKTIF</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.activeSantri || 0}</h3>
          </div>
          <div className="order-1 sm:order-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DCFCE7] text-[#0B4A3F] flex items-center justify-center flex-shrink-0">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Santri Tidak Aktif */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-3.5 sm:p-5 rounded-2xl shadow-soft card-hover flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
          <div className="order-2 sm:order-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">STATUS TIDAK AKTIF</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#D97706] font-serif">{stats?.inactiveSantri || 0}</h3>
          </div>
          <div className="order-1 sm:order-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
            <UserPlus size={20} />
          </div>
        </div>

        {/* Santri Beasiswa */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-3.5 sm:p-5 rounded-2xl shadow-soft card-hover flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
          <div className="order-2 sm:order-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">SANTRI BEASISWA</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#16A34A] font-serif">{stats?.totalBeasiswa || 0}</h3>
          </div>
          <div className="order-1 sm:order-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <Award size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Graph & Santri CRUD List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demografi Santri per Kelas dengan Bar Gradient Hijau-Emas */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80">
          <h2 className="text-base font-bold text-[#0B4A3F] font-serif mb-5 pb-2 border-b border-slate-100">
            📊 Demografi Santri per Kelas
          </h2>
          
          <div className="space-y-4">
            {stats?.classChart && stats.classChart.length > 0 ? (
              stats.classChart.map((c, index) => {
                const maxCount = Math.max(...stats.classChart.map(x => x.jumlah), 1);
                const pct = Math.round((c.jumlah / maxCount) * 100);
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{c.kelas}</span>
                      <span className="text-[#0B4A3F]">{c.jumlah} Santri ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50">
                      <div 
                        className="bg-gradient-to-r from-[#0B4A3F] via-[#16A34A] to-[#D4AF37] h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada data demografi</p>
            )}
          </div>

          <div className="mt-8 p-4 bg-[#0B4A3F]/5 rounded-xl border border-[#0B4A3F]/15 text-xs">
            <h4 className="font-bold text-[#0B4A3F] mb-1">⚙️ Status Layanan SIM:</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
              Sistem berjalan dengan normal. Seluruh data disinkronkan langsung secara real-time ke database cloud. Lakukan backup data secara berkala demi keamanan informasi.
            </p>
          </div>
        </div>

        {/* Tabel Daftar Seluruh Santri */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#0B4A3F] font-serif">📋 Daftar Seluruh Santri</h2>
            
            {/* Search Box & Class Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] focus:bg-white rounded-full py-1.5 px-3 text-xs outline-none text-slate-700 font-bold cursor-pointer transition duration-150"
              >
                <option value="">Semua Kelas</option>
                <option value="Imdad Putra">Imdad Putra</option>
                <option value="Imdad Putri">Imdad Putri</option>
                <option value="Ibtida 1 Putra">Ibtida 1 Putra</option>
                <option value="Ibtida 1 Putri">Ibtida 1 Putri</option>
                <option value="Ibtida 2 Putra">Ibtida 2 Putra</option>
                <option value="Ibtida 2 Putri">Ibtida 2 Putri</option>
                <option value="Ibtida 3">Ibtida 3</option>
                <option value="Tsanawi 1">Tsanawi 1</option>
                <option value="Tsanawi 2">Tsanawi 2</option>
                <option value="Tsanawi 3">Tsanawi 3</option>
              </select>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#0B4A3F]">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama/kelas..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(searchInput);
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] focus:bg-white rounded-l-full py-1.5 pl-9 pr-4 text-xs w-36 outline-none transition duration-200"
                />
              </div>
              <button
                onClick={() => setSearch(searchInput)}
                className="bg-[#0B4A3F] hover:bg-[#083831] text-white text-xs font-bold px-3 py-1.5 rounded-r-full transition shadow-sm border border-[#0B4A3F]"
              >
                Cari
              </button>
            </div>
          </div>

          {/* Table Header Hijau Muda Pastel */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#DCFCE7]/60 text-[#0B4A3F] font-extrabold uppercase tracking-wider border-b border-emerald-200/80">
                  <th className="py-3 px-4 rounded-tl-xl">NAMA LENGKAP</th>
                  <th className="py-3 px-4">KELAS</th>
                  <th className="py-3 px-4">ORANG TUA / WALI</th>
                  <th className="py-3 px-4">NO. HP</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-center rounded-tr-xl">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentSantriList = santriList.slice(indexOfFirstItem, indexOfLastItem);
                  
                  return currentSantriList.length > 0 ? (
                    currentSantriList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-100/60 transition duration-150">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{s.nama}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{s.kelas || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.namaWali || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{s.noHp}</td>
                        {/* Pill-shape Status Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            s.status === 'ACTIVE' 
                              ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30' 
                              : 'bg-slate-100 text-slate-500 border border-slate-300'
                          }`}>
                            {s.status === 'ACTIVE' ? 'AKTIF' : 'TIDAK AKTIF'}
                          </span>
                        </td>
                        {/* Action Icons with Soft Circle Hover & Colors */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <Link 
                              to={`/profil/${s.id}`} 
                              title="Lihat Detail Profil"
                              className="p-2 text-sky-600 hover:bg-sky-100/80 rounded-full transition"
                            >
                              <Eye size={15} />
                            </Link>
                            <button 
                              onClick={() => openEditModal(s)}
                              title="Edit Data Santri"
                              className="p-2 text-[#16A34A] hover:bg-[#DCFCE7] rounded-full transition"
                            >
                              <Edit size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id, s.nama)}
                              title="Hapus Santri"
                              className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-full transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        Tidak ada data santri ditemukan.
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          {(() => {
            const totalPages = Math.ceil(santriList.length / itemsPerPage);
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            
            const getPageNumbers = () => {
              const pages = [];
              for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                  pages.push(i);
                } else if (pages[pages.length - 1] !== '...') {
                  pages.push('...');
                }
              }
              return pages;
            };

            return totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">
                  Menampilkan <strong className="text-slate-800">{indexOfFirstItem + 1}</strong> - <strong className="text-slate-800">{Math.min(indexOfLastItem, santriList.length)}</strong> dari <strong className="text-slate-800">{santriList.length}</strong> santri
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  >
                    Sebelumnya
                  </button>
                  
                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="text-slate-400 px-1.5 font-bold">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition select-none ${
                          currentPage === pageNum
                            ? 'bg-[#0B4A3F] border-[#0B4A3F] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed select-none"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* EDIT SANTRI MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#083831]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#D4AF37]/30">
            <div className="p-5 bg-[#0B4A3F] text-white font-serif font-bold text-base flex justify-between items-center border-b border-[#D4AF37]/30">
              <span>Ubah Informasi Santri</span>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateSantri} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.nama}
                    onChange={(e) => setEditingSantri({ ...editingSantri, nama: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nomor HP</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.noHp || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, noHp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Wali</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.namaWali || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, namaWali: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kelas</label>
                  <select
                    required
                    value={editingSantri.kelas || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, kelas: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none font-bold text-slate-700"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    <option value="Imdad Putra">Imdad Putra</option>
                    <option value="Imdad Putri">Imdad Putri</option>
                    <option value="Ibtida 1 Putra">Ibtida 1 Putra</option>
                    <option value="Ibtida 1 Putri">Ibtida 1 Putri</option>
                    <option value="Ibtida 2 Putra">Ibtida 2 Putra</option>
                    <option value="Ibtida 2 Putri">Ibtida 2 Putri</option>
                    <option value="Ibtida 3">Ibtida 3</option>
                    <option value="Tsanawi 1">Tsanawi 1</option>
                    <option value="Tsanawi 2">Tsanawi 2</option>
                    <option value="Tsanawi 3">Tsanawi 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Status Santri</label>
                  <select
                    value={editingSantri.status || 'ACTIVE'}
                    onChange={(e) => setEditingSantri({ ...editingSantri, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none font-bold"
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="INACTIVE">Tidak Aktif (INACTIVE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    value={editingSantri.email || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Ubah Sandi (Opsional)</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      placeholder="Masukkan sandi baru"
                      value={editingSantri.password || ''}
                      onChange={(e) => setEditingSantri({ ...editingSantri, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-10 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#0B4A3F] transition"
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(editingSantri.tanggalMasuk)}
                    onChange={(e) => setEditingSantri({ ...editingSantri, tanggalMasuk: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none text-slate-700"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="editBeasiswa"
                    className="w-4 h-4 text-[#0B4A3F] border-slate-300 rounded focus:ring-[#0B4A3F]"
                    checked={editingSantri.isBeasiswa || false}
                    onChange={(e) => setEditingSantri({ ...editingSantri, isBeasiswa: e.target.checked })}
                  />
                  <label htmlFor="editBeasiswa" className="text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider cursor-pointer select-none">
                    Penerima Beasiswa
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={editingSantri.alamat}
                  onChange={(e) => setEditingSantri({ ...editingSantri, alamat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B4A3F] hover:bg-[#083831] text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

