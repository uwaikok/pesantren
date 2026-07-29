import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import api from '../utils/api';

function TambahSantri() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    noHp: '',
    namaWali: '',
    alamat: '',
    kelas: '',
    isBeasiswa: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (formData.noHp) {
      const numeric = /^[0-9]+$/;
      if (!numeric.test(formData.noHp)) {
        setError('Nomor HP harus berupa angka saja');
        setLoading(false);
        return;
      }
    }

    try {
      await api.post('/admin/santri', formData);
      setSuccess(`Data santri ${formData.nama} berhasil ditambahkan!`);
      setFormData({ nama: '', email: '', password: '', noHp: '', namaWali: '', alamat: '', kelas: '', isBeasiswa: false });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Gagal menambahkan santri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37]">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
          <UserPlus size={22} className="text-[#D4AF37]" />
          <span>Tambah Santri Baru</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Masukkan data santri secara manual ke dalam sistem lokal.</p>
      </div>

      {error && <div className="bg-[#FEE2E2] text-[#DC2626] p-3.5 rounded-xl text-xs font-semibold mb-6 border border-rose-200">⚠️ {error}</div>}
      {success && <div className="bg-[#DCFCE7] text-[#16A34A] p-3.5 rounded-xl text-xs font-semibold mb-6 border border-emerald-200">✅ {success} Mengalihkan ke beranda...</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Lengkap</label>
          <input 
            type="text" 
            required 
            placeholder="Masukkan nama santri"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" 
            value={formData.nama} 
            onChange={(e) => setFormData({...formData, nama: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nomor Handphone</label>
          <input 
            type="text" 
            placeholder="Masukkan no HP wali/santri"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" 
            value={formData.noHp} 
            onChange={(e) => setFormData({...formData, noHp: e.target.value})} 
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kelas</label>
          <select 
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37] font-bold text-slate-700" 
            value={formData.kelas} 
            onChange={(e) => setFormData({...formData, kelas: e.target.value})}
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
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Wali</label>
          <input 
            type="text" 
            placeholder="Masukkan nama orang tua / wali"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" 
            value={formData.namaWali} 
            onChange={(e) => setFormData({...formData, namaWali: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Email Akses User (Opsional)</label>
          <input 
            type="email" 
            placeholder="santri@email.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Password Akses User (Opsional)</label>
          <input 
            type="password" 
            placeholder="Masukkan kata sandi akses"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
          />
        </div>

        <div className="md:col-span-2 flex items-center space-x-2 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <input 
            type="checkbox" 
            id="isBeasiswa"
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" 
            checked={formData.isBeasiswa} 
            onChange={(e) => setFormData({...formData, isBeasiswa: e.target.checked})} 
          />
          <label htmlFor="isBeasiswa" className="text-xs font-bold text-[#0B4A3F] select-none cursor-pointer">
            Santri Ini Penerima Beasiswa (Bebas Biaya Syariah)
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Lengkap</label>
          <textarea 
            placeholder="Masukkan alamat tinggal santri"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37] min-h-[80px]" 
            value={formData.alamat} 
            onChange={(e) => setFormData({...formData, alamat: e.target.value})} 
          />
        </div>

        <div className="md:col-span-2 mt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-[#0B4A3F] hover:bg-[#083831] disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2"
          >
            <Check size={16} className="text-[#E8C766]" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Data Santri'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default TambahSantri;
