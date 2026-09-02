import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User, 
  Mail, 
  Phone, 
  Sparkles, 
  RefreshCw,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import api from '../utils/api';
import { alertDialog, confirmDialog } from '../utils/dialog';

function PersetujuanAkun() {
  const [pendaftaranList, setPendaftaranList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED'

  // State untuk Modal Warning Pencocokan Santri
  const [warningModalData, setWarningModalData] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // State untuk Modal Tolak Pendaftaran
  const [rejectModalData, setRejectModalData] = useState(null);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    fetchPendaftaran();
  }, []);

  const fetchPendaftaran = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/pendaftaran');
      setPendaftaranList(data);
    } catch (err) {
      console.error('Fetch pendaftaran error:', err);
      alertDialog('Gagal memuat daftar pendaftaran akun', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item, force = false) => {
    setApproveLoading(true);
    try {
      const response = await api.post(`/admin/pendaftaran/${item.id}/approve`, { force });

      if (response.warning && !force) {
        // Tampilkan Modal Peringatan jika tidak ada kecocokan nama santri
        setWarningModalData(item);
        setApproveLoading(false);
        return;
      }

      // Berhasil disetujui
      alertDialog(response.message || 'Pendaftaran akun berhasil disetujui!', 'Sukses');
      setWarningModalData(null);
      fetchPendaftaran();
    } catch (err) {
      console.error('Approve error:', err);
      alertDialog(err.message || 'Gagal menyetujui pendaftaran', 'Error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalData) return;

    setRejectLoading(true);
    try {
      const response = await api.post(`/admin/pendaftaran/${rejectModalData.id}/reject`, {
        alasanPenolakan
      });
      alertDialog(response.message || 'Pendaftaran berhasil ditolak', 'Informasi');
      setRejectModalData(null);
      setAlasanPenolakan('');
      fetchPendaftaran();
    } catch (err) {
      console.error('Reject error:', err);
      alertDialog(err.message || 'Gagal menolak pendaftaran', 'Error');
    } finally {
      setRejectLoading(false);
    }
  };

  // Filter Data Berdasarkan Tab & Search Query
  const filteredList = pendaftaranList.filter(item => {
    const matchesTab = item.status === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || (
      item.nama.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      (item.noHp && item.noHp.toLowerCase().includes(q)) ||
      (item.alamat && item.alamat.toLowerCase().includes(q))
    );
    return matchesTab && matchesQuery;
  });

  const pendingCount = pendaftaranList.filter(i => i.status === 'PENDING').length;
  const approvedCount = pendaftaranList.filter(i => i.status === 'APPROVED').length;
  const rejectedCount = pendaftaranList.filter(i => i.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-[#0B4A3F] to-[#125E50] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-[#D4AF37] mb-2 border border-white/10">
              <UserCheck size={14} />
              <span>Verifikasi & Akun Mandiri</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">Persetujuan Akun Baru</h1>
            <p className="text-xs md:text-sm text-emerald-100/90 mt-1 max-w-xl">
              Tinjau pendaftaran akun mandiri dari santri atau wali santri. Sistem secara otomatis mencocokkan data pendaftar dengan data santri terdaftar.
            </p>
          </div>
          <button
            onClick={fetchPendaftaran}
            className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 border border-white/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('PENDING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING' 
              ? 'bg-amber-500/10 border-amber-500/40 shadow-md ring-2 ring-amber-500/30' 
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu Persetujuan</p>
              <h3 className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('APPROVED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'APPROVED' 
              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md ring-2 ring-emerald-500/30' 
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Telah Disetujui</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">{approvedCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('REJECTED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'REJECTED' 
              ? 'bg-rose-500/10 border-rose-500/40 shadow-md ring-2 ring-rose-500/30' 
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Telah Ditolak</p>
              <h3 className="text-2xl font-bold text-rose-900 mt-1">{rejectedCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-[#0B4A3F] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'APPROVED'
                ? 'bg-[#0B4A3F] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Disetujui ({approvedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'REJECTED'
                ? 'bg-[#0B4A3F] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Ditolak ({rejectedCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pendaftar..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15"
          />
        </div>
      </div>

      {/* Tabel Data Pendaftaran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-semibold animate-pulse">Memuat daftar pendaftaran...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <UserCheck size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Tidak ada pendaftaran dalam kategori ini</p>
            <p className="text-xs text-slate-400 mt-1">Belum ada pengajuan pendaftaran akun baru yang perlu ditinjau.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Pendaftar</th>
                  <th className="py-3.5 px-4">Peran</th>
                  <th className="py-3.5 px-4">Verifikasi & Kontak</th>
                  <th className="py-3.5 px-4">Pencocokan Santri</th>
                  <th className="py-3.5 px-4">Waktu Daftar</th>
                  <th className="py-3.5 px-4 text-center">Aksi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Pendaftar */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-[#0B4A3F]/10 text-[#0B4A3F] font-bold flex items-center justify-center text-sm border border-[#0B4A3F]/20">
                          {item.nama ? item.nama.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{item.nama}</p>
                          <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Mail size={12} className="text-slate-400" />
                            <span>{item.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Peran */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : item.role === 'USTADZ'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.role === 'WALI_SANTRI'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {item.role === 'WALI_SANTRI' ? 'Wali Santri' : item.role === 'USTADZ' ? 'Pengurus/Ustadz' : item.role || 'Santri'}
                      </span>
                    </td>

                    {/* Verifikasi & Kontak */}
                    <td className="py-4 px-4">
                      <div className="space-y-1 text-[11px]">
                        <p className="text-slate-700 flex items-center space-x-1">
                          <Phone size={12} className="text-slate-400" />
                          <span>{item.noHp || '-'}</span>
                        </p>
                        {item.alamat && (
                          <p className="text-slate-600 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200 mt-1 max-w-xs leading-relaxed">
                            <span className="font-bold text-slate-700">Alamat:</span> {item.alamat}
                          </p>
                        )}
                        {item.namaWali && (
                          <p className="text-slate-500">Wali: <span className="font-semibold text-slate-700">{item.namaWali}</span></p>
                        )}
                      </div>
                    </td>

                    {/* Pencocokan Santri */}
                    <td className="py-4 px-4">
                      {item.suggestedMatch ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 max-w-xs">
                          <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-[11px]">
                            <LinkIcon size={13} />
                            <span>Cocok dengan Santri:</span>
                          </div>
                          <p className="text-xs font-bold text-emerald-950 mt-1">{item.suggestedMatch.nama}</p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">Kelas: {item.suggestedMatch.kelas}</p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 max-w-xs text-amber-800 text-[11px]">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <AlertTriangle size={13} className="text-amber-600" />
                            <span>Tidak ditemukan tautan santri</span>
                          </div>
                          <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                            Belum ada nama santri persis di database.
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Waktu Daftar */}
                    <td className="py-4 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Aksi / Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleApprove(item, false)}
                            disabled={approveLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center space-x-1"
                          >
                            <UserCheck size={14} />
                            <span>Terima (ACC)</span>
                          </button>
                          <button
                            onClick={() => setRejectModalData(item)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center space-x-1"
                          >
                            <UserX size={14} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : item.status === 'APPROVED' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                          <CheckCircle size={13} />
                          <span>Telah Disetujui</span>
                        </span>
                      ) : (
                        <div className="text-center">
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px]">
                            <XCircle size={13} />
                            <span>Ditolak</span>
                          </span>
                          {item.alasanPenolakan && (
                            <p className="text-[10px] text-slate-500 italic mt-1 max-w-xs">{item.alasanPenolakan}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL WARNING: PERINGATAN NAMA TIDAK DITEMUKAN */}
      {warningModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Nama Santri Tidak Ditemukan</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-3 text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                Nama <strong>"{warningModalData.nama}"</strong> tidak ditemukan dalam data santri terdaftar saat ini.
              </p>
              <p className="text-[11px] text-amber-800">
                Pastikan data santri sudah diinput terlebih dahulu di menu <strong>"Tambah Santri Baru"</strong>, atau lanjutkan persetujuan sebagai akun tanpa tautan data santri.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-6">
              <button
                onClick={() => handleApprove(warningModalData, true)}
                disabled={approveLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                {approveLoading ? 'Memproses...' : 'Tetap Approve Tanpa Tautan Santri'}
              </button>
              <button
                onClick={() => setWarningModalData(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Tahan Dulu / Batalkan (Input Data Santri Dulu)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOLAK PENDAFTARAN */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <UserX size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">Tolak Pendaftaran Akun</h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Anda akan menolak pendaftaran akun atas nama <strong>{rejectModalData.nama}</strong> ({rejectModalData.email}).
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penolakan (Opsional)</label>
                <textarea
                  value={alasanPenolakan}
                  onChange={(e) => setAlasanPenolakan(e.target.value)}
                  placeholder="Contoh: Data tidak ditemukan dalam daftar pendaftar santri resmi."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalData(null);
                    setAlasanPenolakan('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejectLoading}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition shadow-md"
                >
                  {rejectLoading ? 'Memproses...' : 'Konfirmasi Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersetujuanAkun;
