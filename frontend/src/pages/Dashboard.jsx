import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  UserX,
  ArrowUpRight,
  TrendingUp,
  ChevronsUpDown
} from 'lucide-react';
import api from '../utils/api';
import { confirmDialog, alertDialog } from '../utils/dialog';

function AnimatedNumber({ value }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 1000; // ms
    const increment = Math.ceil(end / (duration / 16)); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString('id-ID')}</>;
}

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

  // State untuk modal detail pengumuman di dashboard santri
  const [dashSelectedNotif, setDashSelectedNotif] = useState(null);

  // State untuk modal list santri beasiswa/tidak aktif
  const [detailModal, setDetailModal] = useState({ isOpen: false, type: '', title: '', data: [], loading: false });

  // State untuk sorting tabel santri
  const [sortConfig, setSortConfig] = useState({ key: 'nama', dir: 'asc' });
  // Ref untuk debounce live search
  const debounceRef = useRef(null);
  // State untuk animasi bar demografi
  const [barsAnimated, setBarsAnimated] = useState(false);

  const handleCardClick = async (type) => {
    setDetailModal({ isOpen: true, type, title: type === 'BEASISWA' ? 'Daftar Santri Penerima Beasiswa' : 'Daftar Santri Tidak Aktif', data: [], loading: true });
    try {
      const list = await api.get('/admin/santri');
      const filtered = type === 'BEASISWA'
        ? list.filter(s => s.isBeasiswa === true || s.isBeasiswa === 'true')
        : list.filter(s => s.status === 'INACTIVE');
      setDetailModal(prev => ({ ...prev, data: filtered, loading: false }));
    } catch (err) {
      console.error(err);
      setDetailModal(prev => ({ ...prev, loading: false }));
      alertDialog('Gagal memuat daftar santri', 'Error');
    }
  };

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

    // Refresh notifikasi santri ketika admin kirim pengumuman baru
    const handleRefreshNotifs = () => {
      if (user.role === 'SANTRI') fetchSantriData();
    };
    window.addEventListener('refreshNotifications', handleRefreshNotifs);
    
    return () => {
      window.removeEventListener('refreshData', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('refreshNotifications', handleRefreshNotifs);
    };
  }, [search, filterKelas, user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterKelas]);

  // Trigger animasi progress bar saat data stats dimuat
  useEffect(() => {
    if (stats) {
      setBarsAnimated(false);
      const t = setTimeout(() => setBarsAnimated(true), 80);
      return () => clearTimeout(t);
    }
  }, [stats?.totalSantri]);

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
        // Tampilkan SEMUA notifikasi: dari admin (DB) + dinamis (SPP/Sanksi dari backend)
        notifications: notifData
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

        {/* Widgets Grid dengan Desain Modern Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Kelas Santri */}
          <div className="bg-white border-l-4 border-l-emerald-500 p-5 rounded-2xl shadow-soft hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36">
            <div className="flex justify-between items-start z-10 w-full">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">KELAS SANTRI</span>
                <h3 className="text-lg sm:text-xl font-extrabold mt-1 text-[#0B4A3F] font-sans tracking-tight break-words">
                  {mySummary?.user.kelas || 'Belum Set'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-inner flex-shrink-0">
                <Users size={22} className="stroke-[2.2]" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600 font-bold z-10">
              <span className="text-slate-400 font-semibold">Tahun Ajaran 2025/2026</span>
            </div>
          </div>

          {/* Card Rata-rata Nilai */}
          {(() => {
            const avgValue = parseFloat(mySummary?.avgNilai) || 0;
            let ringColor = 'stroke-rose-500';
            let statusText = 'Perlu Peningkatan';
            let textClass = 'text-rose-600';
            if (avgValue >= 80) {
              ringColor = 'stroke-emerald-500';
              statusText = 'Sangat Baik';
              textClass = 'text-emerald-600';
            } else if (avgValue >= 65) {
              ringColor = 'stroke-amber-500';
              statusText = 'Cukup Baik';
              textClass = 'text-amber-600';
            }
            return (
              <div className="bg-white border-l-4 border-l-[#D4AF37] p-5 rounded-2xl shadow-soft hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36">
                <div className="flex justify-between items-start z-10 w-full">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">RATA-RATA NILAI</span>
                    <div className="flex items-center gap-2 mt-1">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B4A3F] font-serif tracking-tight">
                        <AnimatedNumber value={avgValue} />
                      </h3>
                      {/* Circular Progress Ring */}
                      <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 transform -rotate-90">
                          <circle cx="16" cy="16" r="13" className="stroke-slate-100" strokeWidth="2.5" fill="transparent" />
                          <circle cx="16" cy="16" r="13" className={`${ringColor} transition-all duration-500`} strokeWidth="2.5" fill="transparent" strokeDasharray="81.6" strokeDashoffset={81.6 - (81.6 * Math.min(avgValue, 100)) / 100} />
                        </svg>
                        <span className="absolute text-[8px] font-extrabold text-slate-500">{Math.round(avgValue)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100/80 text-[#D4AF37] flex items-center justify-center shadow-inner flex-shrink-0">
                    <BookOpen size={22} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold z-10">
                  <span className={`${textClass} bg-slate-50 px-1.5 py-0.5 rounded font-extrabold`}>{statusText}</span>
                </div>
              </div>
            );
          })()}

          {/* Card Total Pelanggaran */}
          {(() => {
            const hasSanksi = (mySummary?.sanksiCount || 0) > 0;
            return (
              <Link
                to="/keamanan"
                className={`bg-white border-l-4 ${hasSanksi ? 'border-l-rose-500 hover:shadow-xl' : 'border-l-emerald-500'} p-5 rounded-2xl shadow-soft hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer group active:scale-[0.98]`}
                title="Klik untuk melihat detail pelanggaran Anda"
              >
                <div className="flex justify-between items-start z-10 w-full">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">TOTAL PELANGGARAN</span>
                    <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 font-serif tracking-tight ${hasSanksi ? 'text-rose-600' : 'text-[#0B4A3F]'}`}>
                      <AnimatedNumber value={mySummary?.sanksiCount || 0} />
                    </h3>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${hasSanksi ? 'from-rose-50 to-rose-100/50 text-rose-600 border-rose-100/80' : 'from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-100/80'} border flex items-center justify-center shadow-inner flex-shrink-0`}>
                    <ShieldAlert size={22} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="flex items-center justify-between z-10 w-full">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold">
                    {hasSanksi ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="text-slate-400 group-hover:text-rose-600 group-hover:underline transition duration-150">Klik untuk lihat detail</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-extrabold">BERSIH ✓</span>
                        <span className="text-slate-400">Tidak ada pelanggaran</span>
                      </>
                    )}
                  </div>
                  <ArrowUpRight size={16} className={`text-rose-500 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 ${hasSanksi ? 'block' : 'hidden'}`} />
                </div>
              </Link>
            );
          })()}

          {/* Card Tunggakan Syariah */}
          {(() => {
            const hasTunggakan = (mySummary?.tunggakan || 0) > 0;
            return (
              <Link
                to="/keuangan"
                className={`bg-white border-l-4 ${hasTunggakan ? 'border-l-rose-500 hover:shadow-xl' : 'border-l-emerald-500'} p-5 rounded-2xl shadow-soft hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer group active:scale-[0.98]`}
                title="Klik untuk melihat detail keuangan & tunggakan Anda"
              >
                <div className="flex justify-between items-start z-10 w-full">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">TUNGGAKAN SYARIAH</span>
                    {hasTunggakan ? (
                      <h3 className="text-xl sm:text-2xl font-extrabold mt-1 text-rose-600 font-serif tracking-tight">
                        Rp <AnimatedNumber value={mySummary.tunggakan} />
                      </h3>
                    ) : (
                      <h3 className="text-xl sm:text-2xl font-extrabold mt-1 text-emerald-600 font-serif tracking-tight">Lunas</h3>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${hasTunggakan ? 'from-rose-50 to-rose-100/50 text-rose-600 border-rose-100/80' : 'from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-100/80'} border flex items-center justify-center shadow-inner flex-shrink-0`}>
                    <DollarSign size={22} className="stroke-[2.2]" />
                  </div>
                </div>
                <div className="flex items-center justify-between z-10 w-full">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold">
                    {hasTunggakan ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="text-slate-400 group-hover:text-rose-600 group-hover:underline transition duration-150">Klik untuk lihat detail</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-extrabold">LUNAS ✓</span>
                        <span className="text-slate-400">Pembayaran bersih</span>
                      </>
                    )}
                  </div>
                  <ArrowUpRight size={16} className={`text-[#D4AF37] opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 ${hasTunggakan ? 'block' : 'hidden'}`} />
                </div>
              </Link>
            );
          })()}
        </div>

        {/* Quick info alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pengumuman Santri - menampilkan SEMUA notifikasi (admin + dinamis SPP/Sanksi) */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80">
            <h2 className="text-base font-bold text-[#0B4A3F] font-serif mb-4 flex items-center justify-between">
              <span>📚 Pengumuman & Pemberitahuan</span>
              {mySummary?.notifications && mySummary.notifications.length > 3 && (
                <span className="text-[9px] text-slate-400 font-sans font-medium">{mySummary.notifications.length} total</span>
              )}
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {mySummary?.notifications && mySummary.notifications.length > 0 ? (
                mySummary.notifications.map(n => {
                  let borderColor = 'border-slate-200/80';
                  let dotColor = 'bg-slate-400';
                  let badgeColor = 'bg-slate-100 text-slate-600';
                  let badgeLabel = 'UMUM';
                  if (n.kategori === 'SPP') {
                    borderColor = 'border-amber-200';
                    dotColor = 'bg-amber-500';
                    badgeColor = 'bg-amber-100 text-amber-700';
                    badgeLabel = 'SYARIAH';
                  } else if (n.kategori === 'KEAMANAN') {
                    borderColor = 'border-rose-200';
                    dotColor = 'bg-rose-500';
                    badgeColor = 'bg-rose-100 text-rose-700';
                    badgeLabel = 'SANKSI';
                  } else if (n.kategori === 'UJIAN') {
                    borderColor = 'border-emerald-200';
                    dotColor = 'bg-emerald-500';
                    badgeColor = 'bg-emerald-100 text-emerald-700';
                    badgeLabel = 'UJIAN';
                  }
                  return (
                    <div 
                      key={n.id} 
                      className={`p-3.5 bg-slate-50 border ${borderColor} rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]`}
                      onClick={() => setDashSelectedNotif(n)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeColor}`}>{badgeLabel}</span>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0B4A3F]">{n.judul}</h4>
                      <p className="text-slate-500 text-[10px] mt-1 leading-relaxed line-clamp-2">{n.isi}</p>
                      <p className="text-[9px] text-emerald-500 font-bold mt-1.5">Klik untuk baca selengkapnya →</p>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-400">
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

        {/* MODAL DETAIL PENGUMUMAN (DASHBOARD SANTRI) */}
        {dashSelectedNotif && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setDashSelectedNotif(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`sticky top-0 px-5 py-4 rounded-t-2xl flex items-center justify-between ${
                dashSelectedNotif.kategori === 'SPP' ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                dashSelectedNotif.kategori === 'KEAMANAN' ? 'bg-gradient-to-r from-rose-600 to-rose-800' :
                dashSelectedNotif.kategori === 'UJIAN' ? 'bg-gradient-to-r from-emerald-700 to-emerald-900' :
                'bg-gradient-to-r from-[#0B4A3F] to-[#083831]'
              } text-white`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {dashSelectedNotif.kategori === 'SPP' ? '💳' :
                     dashSelectedNotif.kategori === 'KEAMANAN' ? '🛡️' :
                     dashSelectedNotif.kategori === 'UJIAN' ? '📚' : '📢'}
                  </span>
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-80">
                      {dashSelectedNotif.kategori === 'SPP' ? 'SYARIAH / BULANAN' :
                       dashSelectedNotif.kategori === 'KEAMANAN' ? 'KEAMANAN / SANKSI' :
                       dashSelectedNotif.kategori === 'UJIAN' ? 'UJIAN / AKADEMIK' : 'PENGUMUMAN UMUM'}
                    </p>
                    <p className="font-bold text-sm leading-tight">{dashSelectedNotif.judul}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDashSelectedNotif(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-sm transition ml-2 flex-shrink-0"
                >✕</button>
              </div>
              {/* Body */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] text-slate-400 font-mono">
                  {new Date(dashSelectedNotif.createdAt).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{dashSelectedNotif.isi}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => setDashSelectedNotif(null)}
                  className="w-full bg-[#0B4A3F] hover:bg-[#083831] text-white font-bold text-sm py-3 rounded-xl transition shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERING DASHBOARD ADMIN ---
  const sortedSantriList = [...santriList].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = (a[sortConfig.key] || '').toString().toLowerCase();
    const bVal = (b[sortConfig.key] || '').toString().toLowerCase();
    return sortConfig.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

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

      {/* Stats Grid dengan Desain Modern Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Santri */}
        <div className="bg-white border-l-4 border-l-sky-500 p-5 sm:p-6 rounded-2xl shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36">
          {/* Subtle background sparkline graph decoration */}
          <svg className="absolute bottom-0 right-0 left-0 h-12 w-full text-sky-100 opacity-20 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 15 Q 10 10 20 12 T 40 8 T 60 14 T 80 6 T 100 10 L 100 20 L 0 20 Z" fill="url(#grad-blue)" />
            <path d="M 0 15 Q 10 10 20 12 T 40 8 T 60 14 T 80 6 T 100 10" fill="none" stroke="#3B82F6" strokeWidth="1" />
          </svg>

          <div className="flex justify-between items-start z-10 w-full">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">TOTAL SANTRI TERDAFTAR</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold mt-1 text-[#0B4A3F] font-serif tracking-tight">
                <AnimatedNumber value={stats?.totalSantri || 0} />
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-100/80 text-sky-600 flex items-center justify-center shadow-inner flex-shrink-0">
              <Users size={22} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-sky-600 font-bold z-10">
            <TrendingUp size={14} />
            <span className="text-slate-400 font-semibold">Registrasi keseluruhan terdata</span>
          </div>
        </div>

        {/* Santri Aktif */}
        <div className="bg-white border-l-4 border-l-emerald-500 p-5 sm:p-6 rounded-2xl shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36">
          {/* Subtle background sparkline graph decoration */}
          <svg className="absolute bottom-0 right-0 left-0 h-12 w-full text-emerald-100 opacity-20 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 12 Q 15 16 30 10 T 60 14 T 90 8 T 100 6 L 100 20 L 0 20 Z" fill="url(#grad-green)" />
            <path d="M 0 12 Q 15 16 30 10 T 60 14 T 90 8 T 100 6" fill="none" stroke="#10B981" strokeWidth="1" />
          </svg>

          <div className="flex justify-between items-start z-10 w-full">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">SANTRI STATUS AKTIF</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold mt-1 text-[#0B4A3F] font-serif tracking-tight">
                <AnimatedNumber value={stats?.activeSantri || 0} />
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-inner flex-shrink-0">
              <UserCheck size={22} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600 font-bold z-10">
            <Check size={14} className="bg-emerald-100 rounded-full p-0.5" />
            <span className="text-slate-400 font-semibold">Aktif mengikuti pendidikan</span>
          </div>
        </div>

        {/* Santri Beasiswa */}
        <div 
          onClick={() => handleCardClick('BEASISWA')}
          className="bg-white border-l-4 border-l-[#D4AF37] p-5 sm:p-6 rounded-2xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer group active:scale-[0.98]"
          title="Klik untuk melihat daftar nama santri beasiswa"
        >
          {/* Subtle background sparkline graph decoration */}
          <svg className="absolute bottom-0 right-0 left-0 h-12 w-full text-amber-100 opacity-20 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 18 Q 20 8 40 14 T 80 6 T 100 12 L 100 20 L 0 20 Z" fill="url(#grad-gold)" />
            <path d="M 0 18 Q 20 8 40 14 T 80 6 T 100 12" fill="none" stroke="#D4AF37" strokeWidth="1" />
          </svg>

          <div className="flex justify-between items-start z-10 w-full">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">SANTRI BEASISWA</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold mt-1 text-[#D4AF37] font-serif tracking-tight">
                <AnimatedNumber value={stats?.totalBeasiswa || 0} />
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100/80 text-[#D4AF37] flex items-center justify-center shadow-inner flex-shrink-0">
              <Award size={22} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="flex items-center justify-between z-10 w-full">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#D4AF37] font-bold">
              <Award size={14} />
              <span className="text-slate-400 group-hover:text-[#D4AF37] group-hover:underline transition duration-150">Klik untuk lihat daftar</span>
            </div>
            <ArrowUpRight size={16} className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200" />
          </div>
        </div>

        {/* Santri Tidak Aktif */}
        <div 
          onClick={() => handleCardClick('INACTIVE')}
          className="bg-white border-l-4 border-l-rose-500 p-5 sm:p-6 rounded-2xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer group active:scale-[0.98]"
          title="Klik untuk melihat daftar nama santri tidak aktif"
        >
          {/* Subtle background sparkline graph decoration */}
          <svg className="absolute bottom-0 right-0 left-0 h-12 w-full text-rose-100 opacity-20 pointer-events-none" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 10 Q 30 18 60 8 T 95 14 T 100 12 L 100 20 L 0 20 Z" fill="url(#grad-red)" />
            <path d="M 0 10 Q 30 18 60 8 T 95 14 T 100 12" fill="none" stroke="#EF4444" strokeWidth="1" />
          </svg>

          <div className="flex justify-between items-start z-10 w-full">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#8A8F98] uppercase tracking-wider block">STATUS TIDAK AKTIF</span>
              <h3 className="text-3xl sm:text-4xl font-extrabold mt-1 text-rose-600 font-serif tracking-tight">
                <AnimatedNumber value={stats?.inactiveSantri || 0} />
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100/80 text-rose-600 flex items-center justify-center shadow-inner flex-shrink-0">
              <UserX size={22} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="flex items-center justify-between z-10 w-full">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-rose-600 font-bold">
              <UserX size={14} />
              <span className="text-slate-400 group-hover:text-rose-550 group-hover:underline transition duration-150">Klik untuk lihat daftar</span>
            </div>
            <ArrowUpRight size={16} className="text-rose-500 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Graph & Santri CRUD List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demografi Santri per Kelas — Modern Premium */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 flex flex-col">
          <h2 className="text-base font-bold text-[#0B4A3F] font-serif">
            📊 Demografi Santri per Kelas
          </h2>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 mb-4 pb-3 border-b border-slate-100">
            Diurutkan dari kelas terbanyak santri
          </p>

          <div className="space-y-1 flex-1">
            {stats?.classChart && stats.classChart.length > 0 ? (
              [...stats.classChart]
                .sort((a, b) => b.jumlah - a.jumlah)
                .map((c, index) => {
                  const maxCount = Math.max(...stats.classChart.map(x => x.jumlah), 1);
                  const pct = Math.round((c.jumlah / maxCount) * 100);
                  let barColor, pillBg, pillText;
                  if (pct > 70) {
                    barColor = 'bg-emerald-600';
                    pillBg = 'bg-emerald-50';
                    pillText = 'text-emerald-700';
                  } else if (pct > 30) {
                    barColor = 'bg-amber-500';
                    pillBg = 'bg-amber-50';
                    pillText = 'text-amber-700';
                  } else {
                    barColor = 'bg-rose-400';
                    pillBg = 'bg-rose-50';
                    pillText = 'text-rose-600';
                  }
                  return (
                    <div key={index} className="group px-3 py-2.5 -mx-3 rounded-xl hover:bg-slate-50/80 transition-all duration-150 cursor-default">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{c.kelas}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${pillBg} ${pillText}`}>
                          {c.jumlah} · {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-200/40">
                        <div
                          className={`${barColor} h-full rounded-full transition-all duration-700 ease-out`}
                          style={{ width: barsAnimated ? `${pct}%` : '0%' }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada data demografi</p>
            )}
          </div>

          {/* Status Layanan SIM — Card Premium */}
          <div className="mt-5 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/40 rounded-2xl border border-emerald-200/60 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                  <Check size={13} className="text-white stroke-[3]" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white animate-ping opacity-75" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Sistem Online</h4>
                <p className="text-[9px] text-emerald-600 font-semibold">Status Layanan SIM: Normal</p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-700/80 leading-relaxed">
              Seluruh data tersinkronisasi real-time ke database cloud. Lakukan backup berkala demi keamanan data pesantren.
            </p>
          </div>
        </div>

        {/* Tabel Daftar Seluruh Santri */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#0B4A3F] font-serif">📋 Daftar Seluruh Santri</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{santriList.length} total santri terdaftar</p>
            </div>
            {/* Search Box & Class Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-white rounded-xl py-2 px-3 text-xs outline-none text-slate-700 font-bold cursor-pointer transition duration-150"
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
              <div className="flex items-center">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari nama / kelas..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => setSearch(e.target.value), 400);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        clearTimeout(debounceRef.current);
                        setSearch(searchInput);
                      }
                    }}
                    className="bg-slate-50 border border-slate-200 border-r-0 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-white rounded-l-xl py-2 pl-9 pr-4 text-xs w-44 outline-none transition duration-200"
                  />
                </div>
                <button
                  onClick={() => { clearTimeout(debounceRef.current); setSearch(searchInput); }}
                  className="bg-[#0B4A3F] hover:bg-[#083831] active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-r-xl transition shadow-sm hover:shadow-md border border-[#0B4A3F]"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>

          {/* Table with horizontal scroll */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#0B4A3F] to-[#094137] text-white">
                  <th
                    className="py-3.5 px-4 rounded-tl-xl font-extrabold uppercase tracking-widest text-[10px] cursor-pointer select-none hover:bg-white/10 transition-colors"
                    onClick={() => setSortConfig(prev => ({ key: 'nama', dir: prev.key === 'nama' && prev.dir === 'asc' ? 'desc' : 'asc' }))}
                  >
                    <span className="flex items-center gap-1.5">NAMA LENGKAP <ChevronsUpDown size={11} className="opacity-60" /></span>
                  </th>
                  <th
                    className="py-3.5 px-4 font-extrabold uppercase tracking-widest text-[10px] cursor-pointer select-none hover:bg-white/10 transition-colors"
                    onClick={() => setSortConfig(prev => ({ key: 'kelas', dir: prev.key === 'kelas' && prev.dir === 'asc' ? 'desc' : 'asc' }))}
                  >
                    <span className="flex items-center gap-1.5">KELAS <ChevronsUpDown size={11} className="opacity-60" /></span>
                  </th>
                  <th className="py-3.5 px-4 font-extrabold uppercase tracking-widest text-[10px]">ORANG TUA / WALI</th>
                  <th className="py-3.5 px-4 font-extrabold uppercase tracking-widest text-[10px]">NO. HP</th>
                  <th
                    className="py-3.5 px-4 font-extrabold uppercase tracking-widest text-[10px] cursor-pointer select-none hover:bg-white/10 transition-colors"
                    onClick={() => setSortConfig(prev => ({ key: 'status', dir: prev.key === 'status' && prev.dir === 'asc' ? 'desc' : 'asc' }))}
                  >
                    <span className="flex items-center gap-1.5">STATUS <ChevronsUpDown size={11} className="opacity-60" /></span>
                  </th>
                  <th className="py-3.5 px-4 text-center rounded-tr-xl font-extrabold uppercase tracking-widest text-[10px]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = sortedSantriList.slice(indexOfFirstItem, indexOfLastItem);
                  return currentItems.length > 0 ? (
                    currentItems.map((s, rowIdx) => (
                      <tr key={s.id} className={`hover:bg-emerald-50/40 transition duration-150 ${rowIdx % 2 === 1 ? 'bg-slate-50/60' : ''}`}>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{s.nama}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{s.kelas || <span className="text-slate-300 italic">—</span>}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.namaWali || <span className="text-slate-300 italic">—</span>}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {s.noHp ? s.noHp : <span className="text-slate-300 italic text-[10px]">Belum diisi</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {s.status === 'ACTIVE' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            )}
                            {s.status === 'ACTIVE' ? 'AKTIF' : 'TIDAK AKTIF'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Link
                              to={`/profil/${s.id}`}
                              title="Lihat Detail Profil"
                              className="p-2 text-sky-600 hover:bg-sky-100/80 rounded-full transition"
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              onClick={() => openEditModal(s)}
                              title="Edit Data Santri"
                              className="p-2 text-emerald-600 hover:bg-emerald-100/80 rounded-full transition"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.nama)}
                              title="Hapus Santri"
                              className="p-2 text-rose-500 hover:bg-rose-100/80 rounded-full transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-400">
                        <Search size={20} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Tidak ada data santri ditemukan.</p>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {(() => {
            const totalPages = Math.ceil(sortedSantriList.length / itemsPerPage);
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;

            if (sortedSantriList.length === 0) return null;

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

            return (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">
                  Menampilkan <strong className="text-slate-800">{indexOfFirstItem + 1}</strong> – <strong className="text-slate-800">{Math.min(indexOfLastItem, sortedSantriList.length)}</strong> dari <strong className="text-slate-800">{sortedSantriList.length}</strong> santri
                </span>
                {totalPages > 1 && (
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
                )}
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

      {/* DETAIL MODAL UNTUK BEASISWA / TIDAK AKTIF */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 bg-[#083831]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#D4AF37]/30 flex flex-col max-h-[80vh]">
            <div className="p-5 bg-[#0B4A3F] text-white font-serif font-bold text-sm md:text-base flex justify-between items-center border-b border-[#D4AF37]/30">
              <span className="flex items-center space-x-2">
                {detailModal.type === 'BEASISWA' ? <Award size={18} className="text-[#D4AF37]" /> : <UserX size={18} className="text-[#D4AF37]" />}
                <span>{detailModal.title}</span>
              </span>
              <button 
                onClick={() => setDetailModal({ isOpen: false, type: '', title: '', data: [], loading: false })}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {detailModal.loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-400 font-semibold">Memuat daftar santri...</span>
                </div>
              ) : detailModal.data.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 font-extrabold text-slate-700 border-b border-slate-200 pb-2.5 mb-2.5 uppercase tracking-wider text-[10px]">
                    <span>Nama Santri</span>
                    <span>Kelas</span>
                    <span>Wali / No HP</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                    {detailModal.data.map((s, idx) => (
                      <div key={s.id || idx} className="grid grid-cols-3 py-3 text-slate-650 font-medium hover:bg-slate-50 px-1 rounded transition duration-150">
                        <span className="font-bold text-[#0B4A3F]">{s.nama}</span>
                        <span>{s.kelas || '-'}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{s.namaWali || '-'} ({s.noHp || '-'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">
                  Tidak ada data santri ditemukan.
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button 
                onClick={() => setDetailModal({ isOpen: false, type: '', title: '', data: [], loading: false })}
                className="bg-[#0B4A3F] hover:bg-[#083831] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

