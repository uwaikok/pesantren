import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import { alertDialog } from '../utils/dialog';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !/\S+@\S+\.\S+/.test(val)) {
      setEmailError('Format email tidak valid (contoh: nama@email.com)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }
    if (emailError) {
      setError('Harap perbaiki format email terlebih dahulu');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0b3830] via-[#082a24] to-[#041411] p-4 md:p-8 relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Pattern background Islami Geometris */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l12 28 28 12-28 12-12 28-12-28-28-12 28-12z' fill='%23D4AF37' fill-rule='evenodd'/%3E%3C/svg%3E")`, 
          backgroundSize: '80px 80px' 
        }}
      ></div>

      {/* Spotlight Effect / Soft gold & green glow in background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#0B4A3F]/30 to-transparent rounded-full blur-[130px] pointer-events-none"></div>

      {/* Card Form Utama */}
      <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-[0_25px_60px_-15px_rgba(4,30,26,0.4)] border border-white/40 overflow-hidden relative backdrop-blur-xl animate-fade-in-up z-10">
        {/* Border Gradient Emas Premium */}
        <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#FFF5D1] to-[#D4AF37]"></div>

        <div className="p-6 md:p-8">
          {/* Header & Logo dengan circular glow */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              {/* Gold glow behind logo */}
              <div className="absolute inset-0 bg-[#D4AF37]/35 rounded-3xl blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#0B4A3F] to-[#083831] rounded-2xl flex items-center justify-center shadow-lg border border-[#D4AF37]/45 p-2.5 mx-auto">
                <img src="/logo.png" className="w-full h-full object-contain filter drop-shadow-md" alt="Logo Pesantren" />
              </div>
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#0B4A3F] tracking-tight">SIM Pesantren</h2>
            <h3 className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-[0.2em] mt-1.5">MIFTAHUL HUDA AS-SYADZILI</h3>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Sistem Informasi Manajemen & Akademik Pesantren</p>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3.5 rounded-xl text-xs font-semibold mb-4 flex items-start space-x-2 shadow-sm animate-shake">
              <span className="text-sm mt-0.5">⚠️</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#0B4A3F] uppercase tracking-wider mb-1.5">Alamat Email</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#0B4A3F] transition-colors duration-200">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="nama@pesantren.com"
                  className={`w-full bg-slate-50/80 border ${emailError ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:border-[#0B4A3F] focus:ring-[#0B4A3F]/15'} focus:ring-4 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-xs font-medium outline-none transition duration-200`}
                  required
                />
              </div>
              {emailError && (
                <span className="text-[10px] text-rose-500 font-semibold mt-1.5 block animate-fade-in">
                  {emailError}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-extrabold text-[#0B4A3F] uppercase tracking-wider">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => alertDialog('Lupa kata sandi? Silakan hubungi admin atau pengurus di kantor pesantren untuk mereset kata sandi Anda ke kata sandi default ("santri123").', 'Lupa Kata Sandi')}
                  className="text-[10px] text-[#D4AF37] hover:text-[#B89327] hover:underline font-bold transition-colors duration-200"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#0B4A3F] transition-colors duration-200">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#0B4A3F] focus:ring-4 focus:ring-[#0B4A3F]/15 focus:bg-white rounded-xl py-3 pl-10 pr-10 text-xs font-medium outline-none transition duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0B4A3F] transition active:scale-90"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Tombol Masuk Aplikasi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-[#0B4A3F] to-[#125E50] hover:from-[#083831] hover:to-[#0B4A3F] text-white rounded-xl py-3.5 font-bold text-xs shadow-lg shadow-[#0B4A3F]/20 border border-[#D4AF37]/35 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk Aplikasi</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer luar Card */}
      <div className="mt-8 text-center text-[10px] text-slate-400/80 font-medium tracking-wide z-10">
        © 2026 Pesantren Miftahul Huda As-Syadzili. All rights reserved.
      </div>
    </div>
  );
}

export default Login;
