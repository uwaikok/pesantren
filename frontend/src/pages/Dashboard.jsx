import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  ShieldAlert, 
  Search, 
  Filter, 
  Check, 
  Eye, 
  Trash2, 
  Edit, 
  AlertTriangle,
  ArrowRight,
  BookOpen,
  DollarSign
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
    if (!window.confirm(`PERINGATAN: Menghapus data santri "${nama}" akan menghapus seluruh data nilai, sanksi, dan SPP yang bersangkutan. Lanjutkan?`)) return;
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
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RENDERING DASHBOARD SANTRI ---
  if (user.role === 'SANTRI') {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-emerald-600/40 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Assalamu'alaikum Wr. Wb.
              </span>
              <h1 className="text-2xl md:text-3xl font-bold font-serif mt-3">Selamat Datang, {user.nama}</h1>
              <p className="text-emerald-100 text-xs md:text-sm mt-1.5 opacity-90 max-w-xl">
                Pantau perkembangan akademik, riwayat kedisiplinan, serta administrasi pembayaran bulanan Anda melalui dashboard SIM Pesantren ini.
              </p>
            </div>
            <Link 
              to="/profil" 
              className="inline-flex items-center space-x-2 bg-white text-emerald-950 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 transition shadow-lg text-sm self-start md:self-center"
            >
              <span>Lihat Detail Profil</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Kelas Santri</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{mySummary?.user.kelas || 'Belum Ditentukan'}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="p-3.5 bg-sky-100 text-sky-700 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rata-Rata Nilai</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{mySummary?.avgNilai} / 100</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="p-3.5 bg-rose-100 text-rose-700 rounded-2xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pelanggaran</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">{mySummary?.sanksiCount} Pelanggaran</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <div className="p-3.5 bg-amber-100 text-amber-700 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tunggakan SPP</p>
              <h3 className={`text-lg font-bold mt-1 ${mySummary?.tunggakan > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {mySummary?.tunggakan > 0 ? `Rp ${mySummary.tunggakan.toLocaleString('id-ID')}` : 'Lunas'}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick info alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 font-serif mb-4 flex items-center space-x-2">
              <span>📚 Pengumuman Santri</span>
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <span className="text-xs font-bold text-emerald-800">Ujian Akhir Semester (UAS)</span>
                <p className="text-slate-600 text-xs mt-1">UAS semester genap tahun ajaran 2025/2026 dijadwalkan mulai pekan depan. Harap santri mempersiapkan hafalan kitab dan kebersihan administrasi SPP.</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Kebersihan Komplek Kamar</span>
                <p className="text-slate-600 text-xs mt-1">Roan akbar (gotong royong) seluruh komplek pesantren akan diselenggarakan hari Ahad pagi jam 08:00 WIB.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-serif mb-3">💳 Status Tagihan Keuangan</h2>
              <p className="text-slate-600 text-xs leading-relaxed">
                Pembayaran SPP jatuh tempo setiap tanggal 10 tiap bulannya sebesar <strong>Rp 250.000</strong>. Anda memiliki total <strong>{mySummary?.unpaidMonths} bulan</strong> tunggakan di tahun ini.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Link to="/keuangan" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center py-3 font-semibold text-xs rounded-xl shadow-md transition">
                Bayar SPP / Cek Riwayat
              </Link>
              <Link to="/pendidikan" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center py-3 font-semibold text-xs rounded-xl transition">
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border-t-4 border-[#bf953f] p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Santri Terdaftar</span>
            <h3 className="text-3xl font-extrabold mt-2 text-slate-800 font-serif">{stats?.totalSantri || 0}</h3>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl">
            <Users size={28} />
          </div>
        </div>

        <div className="bg-white border-t-4 border-[#bf953f] p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Santri Status Aktif</span>
            <h3 className="text-3xl font-extrabold mt-2 text-slate-800 font-serif">{stats?.activeSantri || 0}</h3>
          </div>
          <div className="p-4 bg-teal-50 text-teal-700 rounded-2xl">
            <UserCheck size={28} />
          </div>
        </div>

        <div className="bg-white border-t-4 border-[#bf953f] p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between relative">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendaftaran Pending</span>
            <h3 className="text-3xl font-extrabold mt-2 text-slate-800 font-serif">{stats?.pendingSantri || 0}</h3>
          </div>
          <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl">
            <UserPlus size={28} />
          </div>
          {stats?.pendingSantri > 0 && (
            <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping"></div>
          )}
        </div>

        <div className="bg-white border-t-4 border-[#bf953f] p-6 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kasus Pelanggaran</span>
            <h3 className="text-3xl font-extrabold mt-2 text-slate-800 font-serif">{stats?.totalSanksi || 0}</h3>
          </div>
          <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl">
            <ShieldAlert size={28} />
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <span>Persetujuan Registrasi Akun Santri Baru ({pendingUsers.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-white border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{u.nama}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{u.email} • HP: {u.noHp}</p>
                  <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block mt-2">Wali: {u.namaWali}</p>
                </div>
                <button
                  onClick={() => handleVerify(u.id, u.nama)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold text-xs shadow transition-all flex items-center space-x-1"
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
        {/* Graphical Representation of Active Students per class */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 font-serif mb-5">📊 Demografi Santri per Kelas</h2>
          
          <div className="space-y-4">
            {stats?.classChart && stats.classChart.length > 0 ? (
              stats.classChart.map((c, index) => {
                // Cari max count untuk menghitung lebar bar persen
                const maxCount = Math.max(...stats.classChart.map(x => x.jumlah), 1);
                const pct = (c.jumlah / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>{c.kelas}</span>
                      <span>{c.jumlah} Santri</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-500" 
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

          <div className="mt-8 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <h4 className="text-xs font-bold text-emerald-800 mb-1">💡 Pengurus Dashboard:</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Modul ini terhubung ke database. Untuk menginput data mata pelajaran, sanksi, atau mencatat SPP santri, navigasikan ke modul masing-masing di sidebar.
            </p>
          </div>
        </div>

        {/* Santri CRUD List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-base font-bold text-slate-800 font-serif">📋 Daftar Seluruh Santri</h2>
            
            {/* Search & Filter Toolbar */}
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Cari santri..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs w-36 focus:bg-white focus:border-emerald-500 outline-none transition"
                />
              </div>

            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Orang Tua / Wali</th>
                  <th className="py-3 px-4">No. HP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {santriList.length > 0 ? (
                  santriList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">{s.nama}</td>
                      <td className="py-3 px-4 text-slate-600">{s.kelas || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{s.namaWali || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">{s.noHp}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          s.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {s.status === 'ACTIVE' ? 'AKTIF' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <Link 
                            to={`/profil/${s.id}`} 
                            title="Detail Profil Resume"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition"
                          >
                            <Eye size={13} />
                          </Link>
                          <button 
                            onClick={() => openEditModal(s)}
                            title="Edit Data Pribadi"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id, s.nama)}
                            title="Hapus Data & Riwayat"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition"
                          >
                            <Trash2 size={13} />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-zoom-in">
            <div className="p-5 bg-emerald-950 text-white font-serif font-bold text-base flex justify-between items-center">
              <span>Ubah Informasi Santri</span>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateSantri} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.nama}
                    onChange={(e) => setEditingSantri({ ...editingSantri, nama: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={editingSantri.email}
                    onChange={(e) => setEditingSantri({ ...editingSantri, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nomor HP</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.noHp}
                    onChange={(e) => setEditingSantri({ ...editingSantri, noHp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Wali</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.namaWali || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, namaWali: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={editingSantri.kelas || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, kelas: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Status Akun</label>
                  <select
                    value={editingSantri.status}
                    onChange={(e) => setEditingSantri({ ...editingSantri, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="PENDING">Ditangguhkan (PENDING)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={editingSantri.alamat}
                  onChange={(e) => setEditingSantri({ ...editingSantri, alamat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none resize-none"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-md shadow-emerald-600/10"
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
