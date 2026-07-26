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
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk modal edit santri
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState(null);

  useEffect(() => {
    fetchAdminData();

    const handleRefresh = () => {
      fetchAdminData();
    };
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
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

  // --- RENDERING DASHBOARD ADMIN ---
  return (
    <div className="space-y-6">
      {/* Stats Grid dengan Border Top Emas Tipis & Soft Circle Background Icon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Santri */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL SANTRI</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.totalSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center flex-shrink-0">
            <Users size={24} />
          </div>
        </div>

        {/* Santri Aktif */}
        <div className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS AKTIF</span>
            <h3 className="text-3xl font-extrabold mt-1 text-[#0B4A3F] font-serif">{stats?.activeSantri || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#0B4A3F] flex items-center justify-center flex-shrink-0">
            <UserCheck size={24} />
          </div>
        </div>

        {/* Tambah Santri Baru Card */}
        <Link to="/tambah-santri" className="bg-white border-t-3 border-t-[#D4AF37] p-5 rounded-2xl shadow-soft card-hover flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AKSI MANUAL</span>
            <h3 className="text-sm font-extrabold mt-3 text-[#0B4A3F] flex items-center space-x-1.5 hover:underline">
              <span>Tambah Santri</span>
              <ArrowRight size={14} className="text-[#D4AF37]" />
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
            <UserPlus size={24} />
          </div>
        </Link>

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
                      <span>{c.kelas || 'Belum Ditentukan'}</span>
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
              Sistem kasir/server pesantren beroperasi penuh secara lokal. Kelola mata pelajaran, sanksi, dan keuangan Syariah santri secara langsung.
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
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{s.noHp || '-'}</td>
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
                <div className="col-span-2">
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
                    value={editingSantri.noHp || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, noHp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Wali</label>
                  <input
                    type="text"
                    value={editingSantri.namaWali || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, namaWali: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kelas</label>
                  <input
                    type="text"
                    value={editingSantri.kelas || ''}
                    onChange={(e) => setEditingSantri({ ...editingSantri, kelas: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Lengkap</label>
                <textarea
                  rows="2"
                  value={editingSantri.alamat || ''}
                  onChange={(e) => setEditingSantri({ ...editingSantri, alamat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none"
                ></textarea>
              </div>

              {/* Status Santri */}
              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Status Santri</label>
                <select
                  value={editingSantri.status || 'ACTIVE'}
                  onChange={(e) => setEditingSantri({ ...editingSantri, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                >
                  <option value="ACTIVE">AKTIF</option>
                  <option value="INACTIVE">TIDAK AKTIF</option>
                </select>
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

