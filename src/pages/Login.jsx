import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, BookOpen, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('ADMIN'); // Default ADMIN
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#021c15] via-[#043327] to-[#01140f] p-4 md:p-8">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-800/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative glass">
        {/* Decorative Top Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#b38728]"></div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-900 to-[#022c22] rounded-2xl flex items-center justify-center shadow shadow-emerald-950/20 mb-3 border border-[#bf953f]/30">
              <img src="/logo.png" className="w-12 h-12 object-contain" alt="Logo" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-800 tracking-tight">SIM Pesantren</h2>
            <h3 className="text-sm font-bold text-emerald-800 mt-1 mb-1">MIFTAHUL HUDA AS-SYADZILI</h3>
            <p className="text-xs text-slate-500 mt-1">Sistem Informasi Manajemen & Akademik Pesantren</p>
          </div>

          {/* Role selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                role === 'ADMIN'
                  ? 'bg-white text-[#0d5c46] shadow-sm border-b-2 border-[#bf953f]'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Server (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('SANTRI')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                role === 'SANTRI'
                  ? 'bg-white text-[#0d5c46] shadow-sm border-b-2 border-[#bf953f]'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              <BookOpen size={14} />
              <span>User (Santri/Wali)</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-3 rounded-lg text-xs font-medium mb-4 flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pesantren.com"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition duration-150"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Kata Sandi</label>
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
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-10 pr-10 text-sm outline-none transition duration-150"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#0d5c46] to-[#063c2e] hover:from-[#094c39] hover:to-[#042c21] text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-emerald-950/20 border border-[#bf953f]/20 transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk Aplikasi</span>
              )}
            </button>
          </form>

          {/* Dummy account helper tooltip */}
          <div className="mt-5 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] text-emerald-800">
            <span className="font-bold block mb-1">💡 Akun Uji Coba (Demo Mode):</span>
            <p>• Admin: <strong>admin@pesantren.com</strong> / <em>adminpassword</em></p>
            <p>• Santri: <strong>ahmad@pesantren.com</strong> / <em>studentpassword</em></p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Belum memiliki akun santri?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-bold underline">
              Daftar Mandiri Disini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
