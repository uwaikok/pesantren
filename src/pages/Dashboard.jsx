import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserMinus,
  ShieldAlert, 
  Search, 
  Eye, 
  Trash2, 
  Edit, 
  AlertTriangle,
  ArrowRight,
  BookOpen,
  DollarSign,
  Sparkles,
  GraduationCap,
  X
} from 'lucide-react';
import api from '../utils/api';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk paginasi santri
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk modal edit santri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState(null);

  // State untuk data santri (jika login sebagai Santri)
  const [mySummary, setMySummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'BEASISWA'

  // Modal state untuk daftar tidak aktif & beasiswa
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
  const [isBeasiswaModalOpen, setIsBeasiswaModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

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
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
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
        unpaidMonths: profileData.keuangan.unpaidMonths !== undefined ? profileData.keuangan.unpaidMonths : profileData.keuangan.payments.filter(p => p.status === 'BELUM_BAYAR').length,
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
    if (!window.confirm(`Aktifkan akun santri ${nama}?`)) return;
    try {
      await api.put(`/admin/users/${id}/verify`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Gagal mengaktifkan akun');
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`PERINGATAN: Menghapus data santri "${nama}" akan menghapus seluruh data nilai, sanksi, dan keuangan Syariah yang bersangkutan. Lanjutkan?`)) return;
    try {
      await api.delete(`/admin/santri/${id}`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus santri');
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
      alert(err.message || 'Gagal memperbarui data santri');
    }
  };

  // Computed filtered lists
  const inactiveSantriList = santriList.filter(s => s.status === 'INACTIVE');
  const beasiswaSantriList = santriList.filter(s => s.isBeasiswa === true || s.isBeasiswa === 'true');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 text-sm">Gagal Memuat Data</h3>
          <p className="text-slate-500 text-xs mt-1">{error}</p>
        </div>
        <button
          onClick={() => { setError(''); setLoading(true); if (user.role === 'ADMIN') fetchAdminData(); else fetchSantriData(); }}
          className="bg-[#0B4A3F] hover:bg-[#083831] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
        >
          Coba Lagi
        </button>
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
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kelas Santri</p>
              <h3 className="text-base font-extrabold text-[#0B4A3F] mt-0.5">{mySummary?.user.kelas || 'Belum Set'}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rata-Rata Nilai</p>
              <h3 className="text-base font-extrabold text-[#0B4A3F] mt-0.5">{mySummary?.avgNilai} / 100</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pelanggaran</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-0.5">{mySummary?.sanksiCount} Pelanggaran</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37] card-hover flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#0B4A3F] flex items-center justify-center flex-shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tunggakan Syariah</p>
              <h3 className={`text-base font-extrabold mt-0.5 ${mySummary?.tunggakan > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
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
      {/* Stats Grid dengan Border Top Emas Tipis & Soft Circle Background Icon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Santri */}
        <div 
          onClick={() => setFilterStatus('ALL')}
          className={`cursor-pointer p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between transition-all border ${
            filterStatus === 'ALL' 
              ? 'bg-emerald-50/50 border-t-3 border-t-[#0B4A3F] border-[#0B4A3F]/30 ring-2 ring-[#0B4A3F]/10' 
              : 'bg-white border-t-3 border-t-[#D4AF37] border-slate-200/50'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL SANTRI TERDAFTAR</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.totalSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
        </div>

        {/* Santri Aktif */}
        <div 
          onClick={() => setFilterStatus('ACTIVE')}
          className={`cursor-pointer p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between transition-all border ${
            filterStatus === 'ACTIVE' 
              ? 'bg-emerald-50/50 border-t-3 border-t-[#16A34A] border-[#16A34A]/30 ring-2 ring-[#16A34A]/10' 
              : 'bg-white border-t-3 border-t-[#D4AF37] border-slate-200/50'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SANTRI STATUS AKTIF</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.activeSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#0B4A3F] flex items-center justify-center flex-shrink-0">
            <UserCheck size={24} />
          </div>
        </div>

        {/* Santri Tidak Aktif — klik buka modal */}
        <div 
          onClick={() => { setFilterStatus('INACTIVE'); setIsInactiveModalOpen(true); }}
          className={`cursor-pointer p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between transition-all border ${
            filterStatus === 'INACTIVE' 
              ? 'bg-rose-50/60 border-t-3 border-t-[#DC2626] border-[#DC2626]/20 ring-2 ring-[#DC2626]/10' 
              : 'bg-white border-t-3 border-t-[#D4AF37] border-slate-200/50'
          }`}
          title="Klik untuk lihat daftar santri tidak aktif"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIDAK AKTIF</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#DC2626] font-serif">{stats?.inactiveSantri || 0}</h3>
          </div>
          {/* Ikon UserMinus dengan badge X merah kecil di pojok */}
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center flex-shrink-0 relative">
            <UserMinus size={24} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DC2626] rounded-full flex items-center justify-center">
              <X size={9} className="text-white stroke-[3]" />
            </span>
          </div>
        </div>

        {/* Santri Beasiswa — klik buka modal */}
        <div 
          onClick={() => { setFilterStatus('BEASISWA'); setIsBeasiswaModalOpen(true); }}
          className={`cursor-pointer p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between transition-all border ${
            filterStatus === 'BEASISWA' 
              ? 'bg-amber-50/60 border-t-3 border-t-[#16A34A] border-[#16A34A]/30 ring-2 ring-[#16A34A]/10' 
              : 'bg-white border-t-3 border-t-[#D4AF37] border-slate-200/50'
          }`}
          title="Klik untuk lihat daftar santri penerima beasiswa"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SANTRI BEASISWA</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#16A34A] font-serif">{stats?.totalBeasiswa || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <GraduationCap size={24} />
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

          <div className="mt-8 p-4 bg-[#DCFCE7]/40 rounded-xl border border-[#16A34A]/20 text-xs">
            <h4 className="font-bold text-[#0B4A3F] mb-1">💡 Informasi Sistem:</h4>
            <p className="text-[11px] text-slate-650 leading-relaxed">
              Data terhubung langsung dengan database. Kelola mata pelajaran, sanksi, dan keuangan Syariah santri melalui menu sidebar.
            </p>
          </div>
        </div>

        {/* Tabel Daftar Seluruh Santri */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-2 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#0B4A3F] font-serif">📋 Daftar Seluruh Santri</h2>
              {filterStatus !== 'ALL' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#0B4A3F] border border-[#D4AF37]/40 uppercase animate-pulse">
                  <span>Filter: {filterStatus === 'ACTIVE' ? 'Aktif' : filterStatus === 'INACTIVE' ? 'Tidak Aktif' : 'Beasiswa'}</span>
                  <button 
                    onClick={() => setFilterStatus('ALL')}
                    className="hover:text-rose-600 font-bold ml-1 text-xs"
                    title="Hapus Filter"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            
            {/* Search Box Rounded Full Style dengan Ikon Kaca Pembesar Hijau */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#0B4A3F]">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Cari santri..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(searchInput);
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] focus:bg-white rounded-l-full py-1.5 pl-9 pr-4 text-xs w-40 outline-none transition duration-200"
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

          {(() => {
            const getFilteredSantri = () => {
              let result = santriList;
              if (filterStatus === 'ACTIVE') {
                result = result.filter(s => s.status === 'ACTIVE');
              } else if (filterStatus === 'INACTIVE') {
                result = result.filter(s => s.status === 'INACTIVE');
              } else if (filterStatus === 'BEASISWA') {
                result = result.filter(s => s.isBeasiswa === true || s.isBeasiswa === 'true');
              }
              return result;
            };

            const filteredSantri = getFilteredSantri();
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const currentSantriList = filteredSantri.slice(indexOfFirstItem, indexOfLastItem);
            const totalPages = Math.ceil(filteredSantri.length / itemsPerPage);

            return (
              <>
                {/* Table Desktop (Tampil hanya di layar Medium ke atas) */}
                <div className="hidden md:block overflow-x-auto">
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
                      {currentSantriList.length > 0 ? (
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
                                  : 'bg-rose-50 text-[#DC2626] border border-[#DC2626]/25'
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
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List (Tampil hanya di HP / Smartphone) */}
                <div className="md:hidden space-y-3">
                  {currentSantriList.length > 0 ? (
                    currentSantriList.map((s) => (
                      <div key={s.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm relative space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{s.nama}</h4>
                            <p className="text-[10px] text-slate-550 font-medium mt-0.5">{s.kelas || '-'}</p>
                          </div>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                            s.status === 'ACTIVE' 
                              ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/25' 
                              : 'bg-slate-100 text-slate-505 border border-slate-300'
                          }`}>
                            {s.status === 'ACTIVE' ? 'AKTIF' : 'TIDAK AKTIF'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-600 border-t border-dashed border-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Wali</span>
                            <span className="font-semibold text-slate-700">{s.namaWali || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">No. HP</span>
                            <span className="font-mono text-slate-700">{s.noHp || '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                          {s.isBeasiswa && (
                            <span className="inline-flex items-center text-[9px] font-bold bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded">
                              🎓 Beasiswa
                            </span>
                          )}
                          <div className="flex items-center space-x-3 ml-auto">
                            <Link 
                              to={`/profil/${s.id}`} 
                              className="text-sky-600 font-bold text-xs flex items-center space-x-1"
                            >
                              <Eye size={13} />
                              <span>Detail</span>
                            </Link>
                            <button 
                              onClick={() => openEditModal(s)}
                              className="text-[#16A34A] font-bold text-xs flex items-center space-x-1"
                            >
                              <Edit size={13} />
                              <span>Ubah</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id, s.nama)}
                              className="text-[#DC2626] font-bold text-xs flex items-center space-x-1"
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      Tidak ada data santri ditemukan.
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">
                      Menampilkan <strong className="text-slate-800">{indexOfFirstItem + 1}</strong> - <strong className="text-slate-800">{Math.min(indexOfLastItem, filteredSantri.length)}</strong> dari <strong className="text-slate-800">{filteredSantri.length}</strong> santri
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
                      
                      {(() => {
                        const pages = [];
                        for (let i = 1; i <= totalPages; i++) {
                          if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                            pages.push(i);
                          } else if (pages[pages.length - 1] !== '...') {
                            pages.push('...');
                          }
                        }
                        return pages.map((pageNum, idx) => (
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
                        ));
                      })()}

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
                )}
              </>
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
                  <input
                    type="password"
                    placeholder="Masukkan sandi baru"
                    value={editingSantri.password || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
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
      {/* MODAL DAFTAR SANTRI TIDAK AKTIF */}
      {isInactiveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-rose-200/50 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#DC2626] to-[#b91c1c] text-white flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center relative">
                  <UserMinus size={18} />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <X size={8} className="text-[#DC2626] stroke-[3]" />
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base font-serif">Santri Tidak Aktif</h3>
                  <p className="text-rose-100 text-[10px]">{inactiveSantriList.length} santri tercatat tidak aktif</p>
                </div>
              </div>
              <button onClick={() => setIsInactiveModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {inactiveSantriList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <UserCheck size={40} className="text-emerald-400 mb-3" />
                  <p className="text-sm font-bold text-emerald-600">Semua santri berstatus aktif!</p>
                  <p className="text-xs mt-1">Tidak ada santri dengan status tidak aktif.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {inactiveSantriList.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-rose-50/60 border border-rose-100 rounded-xl hover:bg-rose-50 transition">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{s.nama}</p>
                          <p className="text-[10px] text-slate-500">{s.kelas || 'Belum ada kelas'} · Wali: {s.namaWali || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-extrabold bg-rose-100 text-[#DC2626] px-2 py-0.5 rounded-full uppercase">Tdk Aktif</span>
                        <Link to={`/profil/${s.id}`} onClick={() => setIsInactiveModalOpen(false)} className="p-1.5 text-sky-600 hover:bg-sky-100 rounded-full transition" title="Lihat Profil">
                          <Eye size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 p-4 flex-shrink-0 flex justify-between items-center bg-slate-50/50">
              <p className="text-[10px] text-slate-400">Klik ikon 👁 untuk melihat detail profil</p>
              <button onClick={() => setIsInactiveModalOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DAFTAR SANTRI BEASISWA */}
      {isBeasiswaModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-emerald-200/50 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#0B4A3F] to-[#16A34A] text-white flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-serif">Santri Penerima Beasiswa</h3>
                  <p className="text-emerald-100 text-[10px]">{beasiswaSantriList.length} santri mendapat beasiswa</p>
                </div>
              </div>
              <button onClick={() => setIsBeasiswaModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {beasiswaSantriList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <GraduationCap size={40} className="text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Belum ada santri beasiswa</p>
                  <p className="text-xs mt-1">Tandai santri sebagai penerima beasiswa melalui menu edit.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {beasiswaSantriList.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-extrabold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{s.nama}</p>
                          <p className="text-[10px] text-slate-500">{s.kelas || 'Belum ada kelas'} · Wali: {s.namaWali || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${ s.status === 'ACTIVE' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-rose-100 text-[#DC2626]'}`}>
                          {s.status === 'ACTIVE' ? 'Aktif' : 'Tdk Aktif'}
                        </span>
                        <span className="text-[9px] font-extrabold bg-[#D4AF37]/20 text-[#92620A] px-2 py-0.5 rounded-full uppercase border border-[#D4AF37]/30">🎓 Beasiswa</span>
                        <Link to={`/profil/${s.id}`} onClick={() => setIsBeasiswaModalOpen(false)} className="p-1.5 text-sky-600 hover:bg-sky-100 rounded-full transition" title="Lihat Profil">
                          <Eye size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 p-4 flex-shrink-0 flex justify-between items-center bg-slate-50/50">
              <p className="text-[10px] text-slate-400">Klik ikon 👁 untuk melihat detail profil</p>
              <button onClick={() => setIsBeasiswaModalOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
