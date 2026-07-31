import React, { useState, useEffect } from 'react';
import { Bell, Send, Check, Pencil, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import { confirmDialog, alertDialog } from '../utils/dialog';

function KirimPemberitahuan() {
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'UMUM',
    santriId: '',
    isi: ''
  });
  const [allSantri, setAllSantri] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingNotifId, setEditingNotifId] = useState(null);

  useEffect(() => {
    fetchSantri();
    fetchNotifications();
  }, []);

  const fetchSantri = async () => {
    try {
      const data = await api.get('/admin/santri');
      setAllSantri(data);
    } catch (err) {
      console.error('Gagal mengambil data santri:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      // Filter agar hanya menampilkan notifikasi database (yang bukan buatan sistem bermodel string id)
      const dbNotifs = data.filter(n => typeof n.id === 'number');
      setNotifications(dbNotifs);
    } catch (err) {
      console.error('Gagal mengambil notifikasi:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        judul: formData.judul,
        kategori: formData.kategori,
        santriId: formData.santriId ? parseInt(formData.santriId) : null,
        isi: formData.isi
      };

      if (editingNotifId) {
        await api.put(`/notifications/${editingNotifId}`, payload);
        setSuccess('Pemberitahuan berhasil diperbarui!');
        setEditingNotifId(null);
      } else {
        await api.post('/notifications', payload);
        setSuccess('Pemberitahuan berhasil dikirim dan disebarkan ke penerima!');
      }

      setFormData({
        judul: '',
        kategori: 'UMUM',
        santriId: '',
        isi: ''
      });
      fetchNotifications();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pemberitahuan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (n) => {
    setFormData({
      judul: n.judul,
      kategori: n.kategori || 'UMUM',
      santriId: n.santriId ? String(n.santriId) : '',
      isi: n.isi
    });
    setEditingNotifId(n.id);
    setSuccess('');
    setError('');
    // Scroll smooth to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({
      judul: '',
      kategori: 'UMUM',
      santriId: '',
      isi: ''
    });
    setEditingNotifId(null);
    setSuccess('');
    setError('');
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog('Apakah Anda yakin ingin menghapus pemberitahuan ini secara permanen dari server?');
    if (!confirmed) return;

    try {
      await api.delete(`/notifications/${id}`);
      setSuccess('Pemberitahuan berhasil dihapus!');
      fetchNotifications();
      if (editingNotifId === id) {
        handleCancelEdit();
      }
    } catch (err) {
      alertDialog(err.message || 'Gagal menghapus pemberitahuan', 'Gagal');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Kartu Form Kirim/Edit Notifikasi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-[#0B4A3F] to-[#083831] text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-xl -mr-10 -mt-10"></div>
          <div className="flex items-center space-x-3.5 relative z-10">
            <div className="p-3 bg-[#083831] border border-[#D4AF37]/50 rounded-2xl shadow-inner text-[#E8C766]">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="font-serif font-extrabold text-lg md:text-xl tracking-wide text-white leading-tight">
                {editingNotifId ? 'Edit Pemberitahuan SIM' : 'Kirim Pemberitahuan SIM'}
              </h2>
              <p className="text-xs text-[#E8C766] mt-1 font-sans font-medium tracking-wide">
                {editingNotifId ? 'Sesuaikan pengumuman yang sudah dikirim ke santri' : 'Kirim pengumuman resmi ke akun santri global atau personal'}
              </p>
            </div>
          </div>
          {editingNotifId && (
            <button
              onClick={handleCancelEdit}
              className="relative z-10 flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600/35 hover:bg-rose-600 text-rose-100 font-bold text-[10px] transition-colors border border-rose-500/30"
            >
              <X size={12} />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 text-xs">
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center space-x-2 font-semibold">
              <Check size={16} className="text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 flex items-center space-x-2 font-semibold animate-shake">
              <span className="text-rose-600 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1.5">
              Judul Pemberitahuan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pengumuman Libur Menyambut Ramadhan"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:border-[#D4AF37] outline-none transition duration-150"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1.5">
                Kategori
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:border-[#D4AF37] outline-none font-bold text-slate-700 transition duration-150"
              >
                <option value="UMUM">UMUM (Pemberitahuan Biasa)</option>
                <option value="UJIAN">UJIAN (Akademik & Hasil Ujian)</option>
                <option value="SPP">SPP (Syariah, Iuran & Keuangan)</option>
                <option value="KEAMANAN">KEAMANAN (Kedisiplinan & Pelanggaran)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1.5">
                Target Penerima
              </label>
              <select
                value={formData.santriId}
                onChange={(e) => setFormData({ ...formData, santriId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:border-[#D4AF37] outline-none text-slate-700 transition duration-150"
              >
                <option value="">Semua Santri (Global)</option>
                {allSantri.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas || 'Tanpa Kelas'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1.5">
              Isi Pemberitahuan
            </label>
            <textarea
              required
              rows={6}
              placeholder="Tulis detail pesan pengumuman di sini..."
              value={formData.isi}
              onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none transition duration-150"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            {editingNotifId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#0B4A3F] hover:bg-[#083831] disabled:bg-slate-300 text-white font-bold transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <Send size={14} />
              <span>{loading ? 'Menyimpan...' : editingNotifId ? 'Simpan Perubahan' : 'Kirim Pemberitahuan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Pemberitahuan Terkirim */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="font-serif font-extrabold text-[#0B4A3F] text-sm md:text-base border-b border-slate-100 pb-3 flex items-center space-x-2">
          <span>📋 Riwayat Pemberitahuan Terkirim</span>
          <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold">
            {notifications.length} Total
          </span>
        </h3>

        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {notifications.map((n) => {
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (n.kategori === 'UJIAN') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (n.kategori === 'SPP') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              if (n.kategori === 'KEAMANAN') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

              const receiverName = n.santriId 
                ? allSantri.find(s => s.id === n.santriId)?.nama || 'Santri Privat'
                : 'Semua Santri (Global)';

              return (
                <div key={n.id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold tracking-wider ${badgeColor}`}>
                        {n.kategori || 'UMUM'}
                      </span>
                      <span className="text-slate-400 font-bold text-[9px]">
                        • {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-slate-500 font-medium text-[9px] bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md">
                        Penerima: <strong>{receiverName}</strong>
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">{n.judul}</h4>
                    <p className="text-slate-500 leading-relaxed text-xs whitespace-pre-wrap">{n.isi}</p>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-start">
                    <button
                      onClick={() => handleEdit(n)}
                      className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-150 rounded-xl transition duration-150 flex items-center space-x-1 font-bold"
                      title="Edit"
                    >
                      <Pencil size={12} />
                      <span className="text-[10px]">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-150 rounded-xl transition duration-150 flex items-center space-x-1 font-bold"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                      <span className="text-[10px]">Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs">Belum ada pengumuman/pemberitahuan yang dikirim.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default KirimPemberitahuan;
