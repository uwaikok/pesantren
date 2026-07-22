import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, Sparkles } from 'lucide-react';
import api from '../utils/api';

function BuatAkun() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    noHp: '',
    namaWali: '',
    alamat: '',
    kelas: '',
    password: '',
    role: 'SANTRI'
  });
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const numeric = /^[0-9]+$/;
    if (!numeric.test(formData.noHp)) {
      setError('Nomor HP harus berupa angka saja');
      return;
    }

    try {
      await api.post('/auth/register', {
        ...formData,
        status: 'ACTIVE'
      });
      alert(`Akun ${formData.nama} berhasil dibuat dan otomatis AKTIF.`);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Gagal membuat akun');
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37]">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
          <UserPlus size={22} className="text-[#D4AF37]" />
          <span>Buat Akun Pengguna Baru</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">Akun yang dibuat melalui halaman ini akan langsung berstatus AKTIF (Siap digunakan).</p>
      </div>

      {error && <div className="bg-[#FEE2E2] text-[#DC2626] p-3.5 rounded-xl text-xs font-semibold mb-6 border border-rose-200">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Peran Akun</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37] font-bold text-slate-800"
            value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="SANTRI">Santri / Wali</option>
            <option value="ADMIN">Administrator (Pengurus)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Lengkap</label>
          <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Email Login</label>
          <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kata Sandi</label>
          <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nomor Handphone</label>
          <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" value={formData.noHp} onChange={(e) => setFormData({...formData, noHp: e.target.value})} />
        </div>
        
        {formData.role === 'SANTRI' && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kelas (opsional)</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Wali (opsional)</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]" value={formData.namaWali} onChange={(e) => setFormData({...formData, namaWali: e.target.value})} />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Lengkap</label>
          <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37] min-h-[80px]" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} />
        </div>

        <div className="md:col-span-2 mt-2">
          <button type="submit" className="w-full md:w-auto bg-[#0B4A3F] hover:bg-[#083831] text-white font-bold py-3 px-6 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2">
            <Check size={16} className="text-[#E8C766]" />
            <span>Simpan & Aktifkan Akun</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default BuatAkun;

