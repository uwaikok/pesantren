import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, BookOpen, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Simpan token ke localStorage
      localStorage.setItem('simesra_token', response.token);
      
      // Panggil callback sukses
      onLoginSuccess();
      
      // Redirect ke beranda
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Koneksi ke server gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B4A3F] via-[#083831] to-[#041e1a] p-4 md:p-8 relative overflow-hidden">
      {/* Background patterns & Vignette Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-black/60 pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0B4A3F]/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden relative glass backdrop-blur-xl">
        {/* Border Gradient Emas Tipis di Bagian Atas */}
        <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#E8C766] to-[#D4AF37]"></div>

        <div className="p-6 md:p-8">
          {/* Header & Logo Besar & Tajam dengan Gold Glow Effect */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              {/* Soft gold glow behind logo */}
              <div className="absolute inset-0 bg-[#D4AF37] rounded-2xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#0B4A3F] to-[#083831] rounded-2xl flex items-center justify-center shadow-lg border border-[#D4AF37]/40 p-2 mx-auto">
                <img src="/logo.png" className="w-full h-full object-contain filter drop-shadow-md" alt="Logo Pesantren" />
              </div>
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#0B4A3F] tracking-tight">SIM Pesantren</h2>
            <h3 className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-widest mt-1">MIFTAHUL HUDA AS-SYADZILI</h3>
            <p className="text-[11px] text-slate-500 mt-1">Sistem Informasi Manajemen & Akademik Pesantren</p>
          </div>



          {error && (
            <div className="bg-[#FEE2E2] border-l-4 border-[#DC2626] text-[#DC2626] p-3 rounded-lg text-xs font-semibold mb-4 flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#0B4A3F] uppercase tracking-wider mb-1.5">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@pesantren.com"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-xs font-medium outline-none transition duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-extrabold text-[#0B4A3F] uppercase tracking-wider">Kata Sandi</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-white rounded-xl py-3 pl-10 pr-10 text-xs font-medium outline-none transition duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0B4A3F] transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Tombol Masuk Aplikasi - Primary Hijau Tua + Hover Darker + Scale Micro-interaction */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-[#0B4A3F] hover:bg-[#083831] text-white rounded-xl py-3 font-bold text-xs shadow-lg shadow-[#0B4A3F]/20 border border-[#D4AF37]/30 transition transform active:scale-95 duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk Aplikasi</span>
              )}
            </button>
          </form>

          {/* Link Daftar Mandiri warna Emas/Gold */}
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            Belum memiliki akun santri?{' '}
            <Link to="/register" className="text-[#D4AF37] hover:text-[#B79526] font-bold underline transition">
              Daftar Mandiri Disini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

