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
  Trash2, 
  Edit, 
  AlertTriangle,
  ArrowRight,
  BookOpen,
  DollarSign,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk modal edit santri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState(null);

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
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [search, filterKelas, user]);

  const fetchAdminData = async () => {
    try {
      const statsData = await api.get('/admin/stats');
      setStats(statsData);

      const list = await api.get('/admin/santri', { 
        params: { search, kelas: filterKelas } 
      });
      setSantriList(list);

      const pending = await api.get('/admin/users/pending');
      setPendingUsers(pending);
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
        unpaidMonths: profileData.keuangan.payments.filter(p => p.status === 'BELUM_BAYAR').length
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
              <div className="p-4 bg-[#DCFCE7]/50 border border-[#16A34A]/20 rounded-xl">
                <span className="text-xs font-bold text-[#0B4A3F]">Ujian Akhir Semester (UAS)</span>
                <p className="text-slate-650 text-xs mt-1 leading-relaxed">UAS semester genap tahun ajaran 2025/2026 dijadwalkan mulai pekan depan. Harap santri mempersiapkan hafalan kitab dan kebersihan administrasi Syariah.</p>
              </div>
              <div className="p-4 bg-[#FAF9F6] border border-slate-200/60 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Roan Kebersihan Pesantren</span>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">Roan akbar (gotong royong) seluruh komplek pesantren akan diselenggarakan hari Ahad pagi jam 08:00 WIB.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B4A3F] font-serif mb-3">💳 Status Tagihan Keuangan</h2>
              <p className="text-slate-600 text-xs leading-relaxed">
                Pembayaran Syariah jatuh tempo setiap tanggal 10 tiap bulannya sebesar <strong>Rp 250.000</strong>. Anda memiliki total <strong>{mySummary?.unpaidMonths} bulan</strong> tunggakan di tahun ini.
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
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL SANTRI TERDAFTAR</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.totalSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
        </div>

        {/* Santri Aktif */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SANTRI STATUS AKTIF</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.activeSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#0B4A3F] flex items-center justify-center flex-shrink-0">
            <UserCheck size={24} />
          </div>
        </div>

        {/* Pendaftaran Pending */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between relative">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PENDAFTARAN PENDING</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#D97706] font-serif">{stats?.pendingSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
            <UserPlus size={24} />
          </div>
          {stats?.pendingSantri > 0 && (
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
          )}
        </div>

        {/* Total Sanksi */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KASUS PELANGGARAN</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#DC2626] font-serif">{stats?.totalSanksi || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Panel Persetujuan Registrasi Akun Santri Baru - Kuning Pastel Soft + Border Left Gold */}
      {pendingUsers.length > 0 && (
        <div className="bg-[#FEF3C7]/70 border-l-4 border-l-[#D4AF37] border border-amber-200/80 rounded-2xl p-5 shadow-soft">
          <h2 className="text-xs font-bold text-[#D97706] uppercase tracking-wider mb-3 flex items-center space-x-2">
            <AlertTriangle size={16} className="text-[#D97706]" />
            <span>Persetujuan Registrasi Akun Santri Baru ({pendingUsers.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-white border border-amber-200/60 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow transition">
                <div>
                  <h4 className="font-bold text-xs text-[#0B4A3F] font-sans">{u.nama}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{u.email} • HP: {u.noHp}</p>
                  <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mt-1 font-medium">Wali: {u.namaWali}</p>
                </div>
                {/* Tombol Aktifkan Pill-shape Hijau */}
                <button
                  onClick={() => handleVerify(u.id, u.nama)}
                  className="bg-[#16A34A] hover:bg-[#15803d] text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow transition flex items-center space-x-1.5"
                >
                  <Check size={14} />
                  <span>Aktifkan</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <h2 className="text-base font-bold text-[#0B4A3F] font-serif">📋 Daftar Seluruh Santri</h2>
            
            {/* Search Box Rounded Full Style dengan Ikon Kaca Pembesar Hijau */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#0B4A3F]">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Cari santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] focus:bg-white rounded-full py-1.5 pl-9 pr-4 text-xs w-44 outline-none transition duration-200"
              />
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
                {santriList.length > 0 ? (
                  santriList.map((s) => (
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
                            : 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30'
                        }`}>
                          {s.status === 'ACTIVE' ? 'AKTIF' : 'PENDING'}
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
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={editingSantri.email}
                    onChange={(e) => setEditingSantri({ ...editingSantri, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nomor HP</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.noHp}
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
                  <input
                    type="text"
                    required
                    value={editingSantri.kelas || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, kelas: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Status Akun</label>
                  <select
                    value={editingSantri.status}
                    onChange={(e) => setEditingSantri({ ...editingSantri, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none font-bold"
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="PENDING">Ditangguhkan (PENDING)</option>
                  </select>
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

