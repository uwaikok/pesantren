import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Shield, X, CheckCircle, UserPlus } from 'lucide-react';
import api from '../utils/api';
import { alertDialog } from '../utils/dialog';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // State untuk Modal Pendaftaran Akun Mandiri
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  const [regForm, setRegForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    role: 'SANTRI',
    nis: '',
    namaWali: '',
    password: '',
    konfirmasiPassword: ''
  });

  const handleLoginSubmit = async (e) => {
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
      
      // Panggil callback sukses (tunggu sampai selesai auth check agar transisi instan)
      await onLoginSuccess();
      
      // Redirect ke beranda
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Koneksi ke server gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    if (!regForm.nama.trim() || !regForm.email.trim()) {
      setRegError('Nama Lengkap dan Alamat Email wajib diisi');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regForm.email.trim())) {
      setRegError('Format alamat email tidak valid');
      return;
    }

    if (!regForm.password || regForm.password.length < 6) {
      setRegError('Kata sandi minimal 6 karakter');
      return;
    }

    if (regForm.password !== regForm.konfirmasiPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setRegLoading(true);
    try {
      const response = await api.post('/auth/register', {
        nama: regForm.nama,
        email: regForm.email,
        noHp: regForm.noHp,
        role: regForm.role,
        nis: regForm.nis,
        namaWali: regForm.namaWali,
        password: regForm.password
      });

      setRegSuccessMsg(response.message || 'Pendaftaran berhasil dikirim. Akun Anda akan aktif setelah disetujui oleh Admin. Mohon tunggu konfirmasi.');
      setRegForm({
        nama: '',
        email: '',
        noHp: '',
        role: 'SANTRI',
        nis: '',
        namaWali: '',
        password: '',
        konfirmasiPassword: ''
      });
    } catch (err) {
      console.error(err);
      setRegError(err.message || 'Gagal mengirimkan pendaftaran');
    } finally {
      setRegLoading(false);
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

          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@pesantren.com"
                  className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#0B4A3F] focus:ring-4 focus:ring-[#0B4A3F]/15 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-xs font-medium outline-none transition duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-extrabold text-[#0B4A3F] uppercase tracking-wider">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => alertDialog('Lupa kata sandi? Silakan hubungi admin atau pengurus di kantor pesantren untuk mereset kata sandi Anda.', 'Lupa Kata Sandi')}
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

          {/* Link Pendaftaran Akun Baru */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setRegError('');
                  setRegSuccessMsg('');
                  setIsRegisterOpen(true);
                }}
                className="font-bold text-[#0B4A3F] hover:text-[#D4AF37] hover:underline transition-colors duration-200 inline-flex items-center space-x-1"
              >
                <span>Daftar di sini</span>
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer luar Card */}
      <div className="mt-8 text-center text-[10px] text-slate-400/80 font-medium tracking-wide z-10">
        © 2026 Pesantren Miftahul Huda As-Syadzili. All rights reserved.
      </div>

      {/* MODAL PENDAFTARAN AKUN MANDIRI */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/40">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#0B4A3F] to-[#125E50] p-6 text-white rounded-t-3xl relative">
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition"
              >
                <X size={18} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
                  <UserPlus className="text-[#D4AF37]" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif">Daftar Akun Baru</h3>
                  <p className="text-xs text-emerald-100/90">Lengkapi data untuk mengajukan pendaftaran akun SIM Pesantren</p>
                </div>
              </div>
            </div>

            {/* Body Modal */}
            <div className="p-6">
              {regSuccessMsg ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle size={36} />
                  </div>
                  <h4 className="text-base font-bold text-[#0B4A3F]">Pendaftaran Berhasil Dikirim!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {regSuccessMsg}
                  </p>
                  <button
                    onClick={() => setIsRegisterOpen(false)}
                    className="mt-4 px-6 py-2.5 bg-[#0B4A3F] text-white text-xs font-bold rounded-xl hover:bg-[#083831] transition shadow-md"
                  >
                    Kembali ke Halaman Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {regError && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-start space-x-2">
                      <span>⚠️</span>
                      <span className="leading-relaxed">{regError}</span>
                    </div>
                  )}

                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        value={regForm.nama}
                        onChange={(e) => setRegForm({ ...regForm, nama: e.target.value })}
                        placeholder="Sesuai nama di data santri (Contoh: Ahmad Rifki)"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Pastikan diisi sesuai nama santri agar otomatis terhubung.</p>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">
                        Alamat Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Mail size={15} />
                        </span>
                        <input
                          type="email"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                          placeholder="nama@email.com"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">
                        Nomor HP / WhatsApp
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Phone size={15} />
                        </span>
                        <input
                          type="tel"
                          value={regForm.noHp}
                          onChange={(e) => setRegForm({ ...regForm, noHp: e.target.value })}
                          placeholder="08123456789"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Peran / Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">
                      Peran / Status Pendaftar <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Shield size={15} />
                      </span>
                      <select
                        value={regForm.role}
                        onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold outline-none"
                      >
                        <option value="SANTRI">Santri</option>
                        <option value="WALI_SANTRI">Wali Santri</option>
                        <option value="USTADZ">Pengurus / Ustadz</option>
                      </select>
                    </div>
                  </div>

                  {/* Verifikasi Tambahan Opsional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        No. Induk Santri (NIS) <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={regForm.nis}
                        onChange={(e) => setRegForm({ ...regForm, nis: e.target.value })}
                        placeholder="Contoh: 1045"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 px-3 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nama Wali <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={regForm.namaWali}
                        onChange={(e) => setRegForm({ ...regForm, namaWali: e.target.value })}
                        placeholder="Nama Ayah / Ibu / Wali"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 px-3 text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">
                        Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="Min 6 karakter"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 px-3 text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">
                        Konfirmasi Sandi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={showRegPwd ? 'text' : 'password'}
                        value={regForm.konfirmasiPassword}
                        onChange={(e) => setRegForm({ ...regForm, konfirmasiPassword: e.target.value })}
                        placeholder="Ulangi kata sandi"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B4A3F] focus:ring-2 focus:ring-[#0B4A3F]/15 rounded-xl py-2.5 px-3 text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showRegPwdCheck"
                      checked={showRegPwd}
                      onChange={(e) => setShowRegPwd(e.target.checked)}
                      className="rounded border-slate-300 text-[#0B4A3F] focus:ring-[#0B4A3F]"
                    />
                    <label htmlFor="showRegPwdCheck" className="text-xs text-slate-600 cursor-pointer">Tampilkan kata sandi</label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full bg-gradient-to-r from-[#0B4A3F] to-[#125E50] text-white py-3 rounded-xl font-bold text-xs shadow-md border border-[#D4AF37]/30 hover:brightness-110 transition flex items-center justify-center space-x-2"
                    >
                      {regLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Mengirim Pendaftaran...</span>
                        </>
                      ) : (
                        <span>Kirim Pendaftaran Akun</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
