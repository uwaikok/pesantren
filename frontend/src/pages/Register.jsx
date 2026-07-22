import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Home, ChevronLeft, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

function Register() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    noHp: '',
    namaWali: '',
    alamat: '',
    kelas: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nama, email, noHp, namaWali, alamat, password } = formData;

    if (!nama || !email || !noHp || !namaWali || !alamat || !password) {
      setError('Seluruh field wajib diisi');
      return;
    }

    // Validasi HP format angka
    const numericRegex = /^[0-9]+$/;
    if (!numericRegex.test(noHp)) {
      setError('Nomor HP harus berupa angka saja (contoh: 08123456789)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        ...formData,
        role: 'SANTRI' // Selalu mendaftar sebagai santri
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 p-4 md:p-8 relative">
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-gold-400"></div>
            
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-inner border border-emerald-200">
              <ShieldCheck size={40} />
            </div>

            <h3 className="text-xl font-bold text-slate-800 font-serif mb-2">Pendaftaran Berhasil!</h3>
            <p className="text-slate-600 text-xs leading-relaxed mb-8">
              Akun Anda telah berhasil dibuat. Saat ini akun berstatus <strong>Menunggu Persetujuan</strong> dari Server Admin.<br/><br/>
              Pemberitahuan telah dikirimkan ke Admin. Silakan hubungi pengurus jika belum diaktifkan.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs shadow-lg shadow-emerald-600/20 transition duration-150"
            >
              Tutup & Kembali ke Login
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white/95 rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative glass my-8">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-gold-400 to-emerald-600"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/login" className="text-slate-500 hover:text-slate-800 flex items-center text-xs font-semibold">
              <ChevronLeft size={16} />
              <span>Kembali Login</span>
            </Link>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase">Pendaftaran Santri Baru</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold font-serif text-slate-800 tracking-tight">Formulir Pendaftaran</h2>
            <p className="text-xs text-slate-500 mt-1">Lengkapi data diri Anda untuk membuat akun SIM Pesantren</p>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-3 rounded-lg text-xs font-medium mb-4 flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Ahmad Zulfikar"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alamat Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="zulfikar@email.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* No. HP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nomor HP</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    name="noHp"
                    value={formData.noHp}
                    onChange={handleChange}
                    placeholder="08123456789"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Nama Wali */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Orang Tua / Wali</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Home size={16} />
                  </span>
                  <input
                    type="text"
                    name="namaWali"
                    value={formData.namaWali}
                    onChange={handleChange}
                    placeholder="Bp. H. Ridwan"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Kelas Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kelas Santri</label>
                <input
                  type="text"
                  name="kelas"
                  required
                  value={formData.kelas}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-3 text-sm outline-none transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kata Sandi Akun</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alamat Lengkap</label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400">
                  <MapPin size={16} />
                </span>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Jl. Raya Pesantren Km. 5, Dusun Sukamaju, RT 01 RW 02"
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition resize-none"
                  required
                ></textarea>
              </div>
            </div>

            {/* Register Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl py-3 font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition duration-150 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <span>Daftar Sekarang</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
