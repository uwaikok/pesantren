import React, { useState, useEffect } from 'react';
import { Bell, Send, Check } from 'lucide-react';
import api from '../utils/api';

function KirimPemberitahuan() {
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'UMUM',
    santriId: '',
    isi: ''
  });
  const [allSantri, setAllSantri] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSantri();
  }, []);

  const fetchSantri = async () => {
    try {
      const data = await api.get('/admin/santri');
      setAllSantri(data);
    } catch (err) {
      console.error('Gagal mengambil data santri:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/notifications', {
        judul: formData.judul,
        kategori: formData.kategori,
        santriId: formData.santriId ? parseInt(formData.santriId) : null,
        isi: formData.isi
      });
      setSuccess('Pemberitahuan berhasil dikirim dan disebarkan ke penerima!');
      setFormData({
        judul: '',
        kategori: 'UMUM',
        santriId: '',
        isi: ''
      });
    } catch (err) {
      setError(err.message || 'Gagal mengirim pemberitahuan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-[#0B4A3F] to-[#083831] text-white flex items-center space-x-3.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-xl -mr-10 -mt-10"></div>
          <div className="p-3 bg-[#083831] border border-[#D4AF37]/50 rounded-2xl shadow-inner text-[#E8C766]">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="font-serif font-extrabold text-lg md:text-xl tracking-wide text-white leading-tight">
              Kirim Pemberitahuan SIM
            </h2>
            <p className="text-xs text-[#E8C766] mt-1 font-sans font-medium tracking-wide">
              Kirim pengumuman resmi ke akun santri global atau personal
            </p>
          </div>
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

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#0B4A3F] hover:bg-[#083831] disabled:bg-slate-300 text-white font-bold transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <Send size={14} />
              <span>{loading ? 'Mengirim...' : 'Kirim Pemberitahuan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KirimPemberitahuan;
