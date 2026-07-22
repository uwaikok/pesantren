import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Key, BookOpen, ShieldAlert, DollarSign, Edit, Check, Camera, Loader2, Sparkles, Calendar, ShieldCheck, Activity, Award, HelpCircle, Lock } from 'lucide-react';
import api from '../utils/api';

function Profil({ user, onUserUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const targetId = id ? parseInt(id) : user.id;
  const isSelf = targetId === user.id;

  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('pribadi'); // 'pribadi', 'akademik', 'keamanan', 'keuangan'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State untuk upload foto profil
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoSuccess, setFotoSuccess] = useState('');
  const [fotoError, setFotoError] = useState('');
  const [previewFoto, setPreviewFoto] = useState(null);
  const fotoInputRef = useRef(null);
  
  // State untuk form ubah password
  const [passwordForm, setPasswordForm] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasiPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // State untuk form edit biodata
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    namaWali: '',
    alamat: '',
    kelas: ''
  });

  // State untuk Reset Password dialog (hanya untuk admin mereset password santri)
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  useEffect(() => {
    if (user.role !== 'ADMIN' && !isSelf) {
      navigate('/profil', { replace: true });
      return;
    }
    fetchProfile();
  }, [targetId]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/users/${targetId}/profile`);
      setProfileData(data);
      
      setEditForm({
        nama: data.user.nama,
        email: data.user.email,
        noHp: data.user.noHp,
        namaWali: data.user.namaWali || '',
        alamat: data.user.alamat,
        kelas: data.user.kelas || ''
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFotoError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFotoError('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setFotoLoading(true);
    setFotoError('');
    setFotoSuccess('');

    const localUrl = URL.createObjectURL(file);
    setPreviewFoto(localUrl);

    try {
      const useMock = localStorage.getItem('use_mock_db') === 'true' || window.useMockDb === true;

      if (useMock) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
          const idx = users.findIndex(u => u.id === targetId);
          if (idx !== -1) {
            users[idx].fotoProfil = base64;
            localStorage.setItem('mock_users', JSON.stringify(users));
            if (targetId === user.id) {
              const tokenUser = JSON.parse(localStorage.getItem('simesra_token') || '{}');
              tokenUser.fotoProfil = base64;
              localStorage.setItem('simesra_token', JSON.stringify(tokenUser));
              if (onUserUpdate) onUserUpdate({ fotoProfil: base64 });
            }
          }
          setProfileData(prev => ({
            ...prev,
            user: { ...prev.user, fotoProfil: base64 }
          }));
          setFotoSuccess('Foto profil berhasil diperbarui!');
          setFotoLoading(false);
        };
        reader.readAsDataURL(file);
      } else {
        const formData = new FormData();
        formData.append('foto', file);

        const token = localStorage.getItem('simesra_token');
        const response = await fetch(`/api/users/${targetId}/foto-profil`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Gagal mengupload foto');
        }

        const result = await response.json();
        const fotoUrl = `/uploads/foto-profil/${result.fotoProfil?.split('/').pop() || ''}`;
        setProfileData(prev => ({
          ...prev,
          user: { ...prev.user, fotoProfil: result.fotoProfil }
        }));
        setPreviewFoto(fotoUrl);
        setFotoSuccess('Foto profil berhasil diperbarui!');
        if (targetId === user.id && onUserUpdate) onUserUpdate({ fotoProfil: result.fotoProfil });
        setFotoLoading(false);
      }
    } catch (err) {
      setFotoError(err.message || 'Gagal mengupload foto profil');
      setFotoLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    const { passwordLama, passwordBaru, konfirmasiPassword } = passwordForm;

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      setPwdError('Semua field wajib diisi');
      return;
    }

    if (passwordBaru.length < 6) {
      setPwdError('Kata sandi baru minimal 6 karakter');
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setPwdError('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    if (passwordBaru === passwordLama) {
      setPwdError('Kata sandi baru tidak boleh sama dengan kata sandi lama');
      return;
    }

    setPwdLoading(true);
    try {
      // Endpoint terpusat /auth/change-password berlaku untuk ADMIN & SANTRI.
      // Verifikasi password lama dilakukan di sisi API, lalu password baru disimpan,
      // dan token diperbarui (tanpa menyertakan password di dalam token).
      await api.post('/auth/change-password', { passwordLama, passwordBaru });

      setPwdSuccess('✓ Kata sandi berhasil diperbarui! Kata sandi lama sudah tidak berlaku.');
      setPasswordForm({ passwordLama: '', passwordBaru: '', konfirmasiPassword: '' });
    } catch (err) {
      setPwdError(err.message || 'Gagal memperbarui kata sandi');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSaveBiodata = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/santri/${targetId}`, editForm);
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui biodata');
    }
  };

  // Pemicu reset password santri oleh admin
  const handleResetPasswordSantri = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin mereset kata sandi santri "${profileData.user.nama}" menjadi default?`)) return;
    
    setResettingPassword(true);
    setResetSuccessMessage('');
    try {
      const defaultPassword = 'student123';
      
      const useMock = localStorage.getItem('use_mock_db') === 'true' || window.useMockDb === true;
      if (useMock) {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const idx = users.findIndex(u => u.id === targetId);
        if (idx === -1) throw new Error('Santri tidak ditemukan');
        users[idx].password = defaultPassword;
        localStorage.setItem('mock_users', JSON.stringify(users));
      } else {
        await api.put(`/admin/santri/${targetId}`, { password: defaultPassword });
      }
      
      setResetSuccessMessage(`Kata sandi ${profileData.user.nama} berhasil direset menjadi: ${defaultPassword}`);
    } catch (err) {
      alert(err.message || 'Gagal mereset kata sandi');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-[#FEE2E2] border-l-4 border-[#DC2626] text-[#DC2626] p-4 rounded-xl text-xs font-semibold">
        {error || 'Profil tidak dapat dimuat.'}
      </div>
    );
  }

  const isTargetAdmin = profileData.user.role === 'ADMIN';

  // Format Tanggal Masuk / Bergabung
  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return '1 Juli 2025';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Dapatkan sanksi paling baru
  const sanksiTerakhir = profileData.keamanan && profileData.keamanan.length > 0
    ? [...profileData.keamanan].sort((a, b) => new Date(b.tanggalPelanggaran) - new Date(a.tanggalPelanggaran))[0]
    : null;

  // Hitung jumlah sanksi per kategori
  const countSanksiKategori = (kat) => {
    return profileData.keamanan ? profileData.keamanan.filter(s => s.kategori === kat).length : 0;
  };

  // Pembayaran bulan berjalan
  const currentMonthNum = new Date().getMonth() + 1;
  const paymentBulanIni = profileData.keuangan.payments 
    ? profileData.keuangan.payments.find(p => p.bulan === currentMonthNum) 
    : null;

  return (
    <div className="space-y-6">
      {/* HEADER CARD PROFIL */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37]">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          
          {/* FOTO PROFIL DENGAN GOLD RING & GLOW */}
          <div className="relative group flex-shrink-0">
            <div className="w-22 h-22 rounded-full overflow-hidden bg-gradient-to-br from-[#0B4A3F] to-[#083831] text-white flex items-center justify-center font-bold text-3xl shadow-lg border-4 border-white ring-2 ring-[#D4AF37]/50">
              {(previewFoto || profileData.user.fotoProfil) ? (
                <img
                  src={previewFoto || (profileData.user.fotoProfil?.startsWith('data:') ? profileData.user.fotoProfil : `/${profileData.user.fotoProfil}`)}
                  alt={profileData.user.nama}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.querySelector('.foto-initial')?.classList.remove('hidden'); }}
                />
              ) : (
                <span className="foto-initial uppercase font-serif text-[#E8C766]">{profileData.user.nama.charAt(0)}</span>
              )}
            </div>

            {(isSelf || user.role === 'ADMIN') && (
              <>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleUploadFoto}
                  id="foto-profil-input"
                />
                <label
                  htmlFor="foto-profil-input"
                  className={`absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    fotoLoading 
                      ? 'bg-black/50' 
                      : 'bg-black/0 group-hover:bg-black/50'
                  }`}
                >
                  {fotoLoading ? (
                    <Loader2 size={20} className="text-white animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </label>
              </>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#0B4A3F] font-serif">{profileData.user.nama}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{profileData.user.email}</p>
            <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold px-3 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30 uppercase">
                <Sparkles size={10} />
                <span>{profileData.user.role === 'ADMIN' ? 'Admin / Pengurus' : `Santri (${profileData.user.kelas || '-'})`}</span>
              </span>
              <span className="inline-block text-[10px] font-extrabold px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                STATUS: {profileData.user.status}
              </span>
            </div>
            {fotoSuccess && (
              <p className="text-[#16A34A] text-[10px] font-semibold mt-1.5 flex items-center gap-1">
                <Check size={12} /> {fotoSuccess}
              </p>
            )}
            {fotoError && (
              <p className="text-[#DC2626] text-[10px] font-semibold mt-1.5">⚠️ {fotoError}</p>
            )}
          </div>

          {/* DUA TOMBOL AKSI UTAMA DI KANAN HEADER: EDIT BIODATA & RESET PASSWORD */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Edit Biodata (Bisa untuk Admin mengedit diri sendiri/santri, ATAU Santri mengedit dirinya sendiri) */}
            {((isTargetAdmin && isSelf) || (!isTargetAdmin && user.role === 'ADMIN')) && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-[#DCFCE7] hover:bg-emerald-200 text-[#0B4A3F] px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition border border-[#16A34A]/30 flex items-center space-x-1.5"
              >
                <Edit size={14} />
                <span>{isEditing ? 'Batal Edit' : 'Edit Biodata'}</span>
              </button>
            )}

            {/* Tombol Reset Password (Hanya muncul jika yang melihat adalah Admin DAN targetnya adalah akun Santri) */}
            {user.role === 'ADMIN' && !isTargetAdmin && (
              <button
                onClick={handleResetPasswordSantri}
                disabled={resettingPassword}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                {resettingPassword ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                <span>Reset Sandi Santri</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifikasi Reset Password */}
        {resetSuccessMessage && (
          <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-lg text-xs font-bold animate-pulse">
            ✨ {resetSuccessMessage}
          </div>
        )}
      </div>

      {/* PROFIL SEBAGAI SANTRI */}
      {!isTargetAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* TABS SIDEBAR */}
          <div className="lg:col-span-1 bg-white p-3 rounded-2xl shadow-soft border border-slate-200/80 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 text-xs">
            <button
              onClick={() => setActiveTab('pribadi')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'pribadi'
                  ? 'bg-[#0B4A3F] text-white shadow-md border-l-4 border-l-[#D4AF37]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={16} className={activeTab === 'pribadi' ? 'text-[#E8C766]' : ''} />
              <span>Biodata Santri</span>
            </button>
            <button
              onClick={() => setActiveTab('akademik')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'akademik'
                  ? 'bg-[#0B4A3F] text-white shadow-md border-l-4 border-l-[#D4AF37]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} className={activeTab === 'akademik' ? 'text-[#E8C766]' : ''} />
              <span>Riwayat Akademik</span>
            </button>
            <button
              onClick={() => setActiveTab('keamanan')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'keamanan'
                  ? 'bg-[#0B4A3F] text-white shadow-md border-l-4 border-l-[#D4AF37]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert size={16} className={activeTab === 'keamanan' ? 'text-[#E8C766]' : ''} />
              <span>Riwayat Kedisiplinan</span>
            </button>
            <button
              onClick={() => setActiveTab('keuangan')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'keuangan'
                  ? 'bg-[#0B4A3F] text-white shadow-md border-l-4 border-l-[#D4AF37]'
                  : 'text-slate-650 hover:bg-slate-50'
              }`}
            >
              <DollarSign size={16} className={activeTab === 'keuangan' ? 'text-[#E8C766]' : ''} />
              <span>Buku Syariah</span>
            </button>
          </div>

          {/* CONTENT PANEL */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 min-h-[300px]">
            
            {/* TAB: PRIBADI */}
            {activeTab === 'pribadi' && (
              <div className="space-y-6">
                <h2 className="text-base font-bold text-[#0B4A3F] font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <User size={18} className="text-[#D4AF37]" />
                  <span>Biodata Data Diri Santri</span>
                </h2>

                {isEditing ? (
                  <form onSubmit={handleSaveBiodata} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={editForm.nama}
                          onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">No. HP</label>
                        <input
                          type="text"
                          required
                          value={editForm.noHp}
                          onChange={(e) => setEditForm({ ...editForm, noHp: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Wali</label>
                        <input
                          type="text"
                          required
                          value={editForm.namaWali}
                          onChange={(e) => setEditForm({ ...editForm, namaWali: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kelas</label>
                        <input
                          type="text"
                          required
                          value={editForm.kelas}
                          onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Lengkap</label>
                      <textarea
                        rows="3"
                        required
                        value={editForm.alamat}
                        onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="bg-[#0B4A3F] hover:bg-[#083831] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md"
                    >
                      Simpan Perubahan
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><User size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NAMA LENGKAP</p>
                          <p className="font-bold text-slate-800">{profileData.user.nama}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Mail size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ALAMAT EMAIL</p>
                          <p className="font-semibold text-slate-800">{profileData.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Phone size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NOMOR HP</p>
                          <p className="font-semibold text-slate-800">{profileData.user.noHp}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><User size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ORANG TUA / WALI</p>
                          <p className="font-bold text-slate-800">{profileData.user.namaWali || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><MapPin size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ALAMAT RUMAH</p>
                          <p className="font-semibold text-slate-800">{profileData.user.alamat}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Calendar size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TANGGAL MASUK PESANTREN</p>
                          <p className="font-bold text-slate-800">{formatTanggalIndo(profileData.user.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GANTI PASSWORD (Hanya jika melihat profil miliknya sendiri) */}
                {isSelf && (
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-bold text-[#0B4A3F] uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                      <Key size={15} className="text-[#D4AF37]" />
                      <span>Ubah Kata Sandi Akun</span>
                    </h3>

                    {pwdError && <p className="text-[#DC2626] text-xs font-semibold mb-3">⚠️ {pwdError}</p>}
                    {pwdSuccess && <p className="text-[#16A34A] text-xs font-semibold mb-3">✓ {pwdSuccess}</p>}

                    <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="password"
                        placeholder="Kata Sandi Lama"
                        value={passwordForm.passwordLama}
                        onChange={(e) => setPasswordForm({ ...passwordForm, passwordLama: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]"
                      />
                      <input
                        type="password"
                        placeholder="Kata Sandi Baru"
                        value={passwordForm.passwordBaru}
                        onChange={(e) => setPasswordForm({ ...passwordForm, passwordBaru: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]"
                      />
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Konfirmasi Sandi Baru"
                          value={passwordForm.konfirmasiPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasiPassword: e.target.value })}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="submit"
                          disabled={pwdLoading}
                          className="bg-[#0B4A3F] hover:bg-[#083831] text-white px-4 rounded-xl font-bold text-xs transition"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB: AKADEMIK */}
            {activeTab === 'akademik' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <h2 className="text-base font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
                    <BookOpen size={18} className="text-[#D4AF37]" />
                    <span>Riwayat Evaluasi Rapor Santri</span>
                  </h2>
                </div>

                {/* Ringkasan Statistik Akademik */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center space-x-3">
                    <div className="p-3 bg-emerald-100 text-[#0B4A3F] rounded-xl"><Award size={20} /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Mata Pelajaran Diikuti</p>
                      <h4 className="text-base font-bold text-slate-800">{profileData.akademik ? profileData.akademik.length : 0} Mata Kuliah</h4>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center space-x-3">
                    <div className="p-3 bg-amber-100 text-[#D4AF37] rounded-xl"><Sparkles size={20} /></div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Rata-Rata Angka Studi</p>
                      <h4 className="text-base font-bold text-slate-800">
                        {profileData.akademik && profileData.akademik.length > 0
                          ? (profileData.akademik.reduce((acc, curr) => acc + (curr.nilaiUts + curr.nilaiUas) / 2, 0) / profileData.akademik.length).toFixed(1)
                          : '-'}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#DCFCE7]/60 text-[#0B4A3F] font-extrabold uppercase border-b border-emerald-200/80">
                        <th className="py-3 px-4 rounded-tl-xl">TAHUN AJARAN</th>
                        <th className="py-3 px-4">SEMESTER</th>
                        <th className="py-3 px-4">MATA PELAJARAN</th>
                        <th className="py-3 px-4 text-center">UTS</th>
                        <th className="py-3 px-4 text-center">UAS</th>
                        <th className="py-3 px-4 text-center rounded-tr-xl">RATA-RATA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profileData.akademik && profileData.akademik.length > 0 ? (
                        profileData.akademik.map((n) => (
                          <tr key={n.id} className="hover:bg-slate-100/40 transition">
                            <td className="py-3 px-4 font-semibold text-slate-700">{n.tahunAjaran}</td>
                            <td className="py-3 px-4 font-medium">{n.semester}</td>
                            <td className="py-3 px-4 text-slate-800 font-bold">{n.mataPelajaran}</td>
                            <td className="py-3 px-4 text-center font-medium text-slate-650">{n.nilaiUts}</td>
                            <td className="py-3 px-4 text-center font-medium text-slate-650">{n.nilaiUas}</td>
                            <td className="py-3 px-4 text-center font-extrabold text-[#0B4A3F]">
                              {((n.nilaiUts + n.nilaiUas) / 2).toFixed(1)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">Belum ada riwayat akademik tercatat.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: KEAMANAN */}
            {activeTab === 'keamanan' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <h2 className="text-base font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
                    <ShieldAlert size={18} className="text-[#DC2626]" />
                    <span>Daftar Pelanggaran Disiplin</span>
                  </h2>
                </div>

                {/* Ringkasan Kategori Pelanggaran */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#FEF3C7]/40 border border-amber-200 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-amber-700 uppercase">Ringan</p>
                    <h4 className="text-lg font-extrabold text-amber-900 mt-0.5">{countSanksiKategori('RINGAN')}</h4>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-orange-700 uppercase">Sedang</p>
                    <h4 className="text-lg font-extrabold text-orange-950 mt-0.5">{countSanksiKategori('SEDANG')}</h4>
                  </div>
                  <div className="p-3 bg-[#FEE2E2]/60 border border-rose-200 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-rose-700 uppercase">Berat</p>
                    <h4 className="text-lg font-extrabold text-rose-950 mt-0.5">{countSanksiKategori('BERAT')}</h4>
                  </div>
                </div>

                {/* Pelanggaran Terakhir */}
                {sanksiTerakhir && (
                  <div className="bg-[#FEE2E2]/30 border-l-4 border-[#DC2626] p-4 rounded-r-xl">
                    <h4 className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wide">⚠️ Pelanggaran Terakhir</h4>
                    <p className="text-xs font-bold text-slate-800 mt-1">Tanggal: {new Date(sanksiTerakhir.tanggalPelanggaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-xs text-slate-650 mt-1 leading-relaxed">{sanksiTerakhir.deskripsi}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {profileData.keamanan && profileData.keamanan.length > 0 ? (
                    profileData.keamanan.map((s) => (
                      <div key={s.id} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50 flex items-start space-x-3 text-xs leading-relaxed">
                        <div className="mt-0.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            s.kategori === 'RINGAN' ? 'bg-[#FEF3C7] text-[#D97706] border-amber-300' :
                            s.kategori === 'SEDANG' ? 'bg-orange-100 text-orange-850 border-orange-300' :
                            'bg-[#FEE2E2] text-[#DC2626] border-rose-300'
                          }`}>
                            {s.kategori}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {new Date(s.tanggalPelanggaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-slate-650 mt-1 leading-relaxed">{s.deskripsi}</p>
                          <span className="text-[9px] text-slate-400 mt-1.5 block">Tahun Ajaran: {s.tahun}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Alhamdulillah, bersih dari catatan pelanggaran.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: KEUANGAN */}
            {activeTab === 'keuangan' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <h2 className="text-base font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
                    <DollarSign size={18} className="text-[#D4AF37]" />
                    <span>Resume Keuangan Buku Syariah ({profileData.keuangan.tahun})</span>
                  </h2>
                </div>

                {/* Sisa Tunggakan */}
                <div className="p-4 bg-[#FEE2E2]/60 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#DC2626] uppercase tracking-wider">TOTAL TUNGGAKAN SYARIAH ({profileData.keuangan.tahun})</span>
                    <p className="text-slate-500 mt-0.5">Sisa iuran wajib bulanan syariah yang belum terbayar.</p>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#DC2626] font-serif">
                    Rp {profileData.keuangan.totalTunggakan.toLocaleString('id-ID')}
                  </h3>
                </div>

                {/* Status Bulan Berjalan */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-700 uppercase">STATUS BULAN INI ({getNamaBulan(currentMonthNum)})</span>
                    <p className="text-slate-400 mt-0.5">Tagihan iuran wajib bulan berjalan.</p>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full border ${
                    paymentBulanIni && paymentBulanIni.status === 'LUNAS'
                      ? 'bg-[#DCFCE7] text-[#16A34A] border-emerald-300'
                      : 'bg-[#FEE2E2] text-[#DC2626] border-rose-300'
                  }`}>
                    {paymentBulanIni && paymentBulanIni.status === 'LUNAS' ? 'LUNAS' : 'BELUM BAYAR'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                  {profileData.keuangan.payments && profileData.keuangan.payments.map((p) => {
                    const isPaid = p.status === 'LUNAS';
                    return (
                      <div 
                        key={p.bulan}
                        className={`border rounded-xl p-3 flex items-center justify-between border-slate-200/80 ${
                          isPaid ? 'bg-[#DCFCE7]/40 border-[#16A34A]/30' : 'bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{getNamaBulan(p.bulan)}</p>
                          <p className="text-slate-400 mt-0.5">Rp {p.jumlah.toLocaleString('id-ID')}</p>
                        </div>
                        <span className={`font-extrabold uppercase text-[8px] rounded-full px-2 py-0.5 ${
                          isPaid ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'
                        }`}>
                          {isPaid ? 'Lunas' : 'Belum'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PROFIL SEBAGAI ADMIN / PENGURUS (EDITABLE) */
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 min-h-[300px]">
          <h2 className="text-base font-bold text-[#0B4A3F] font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
            <User size={18} className="text-[#D4AF37]" />
            <span>Informasi Detail Akun Pengurus</span>
          </h2>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            
            {/* Sisi Kiri: Biodata Admin (Editable jika isEditing true) */}
            <div className="lg:col-span-2 space-y-5 border-r border-slate-100 pr-0 lg:pr-6">
              {isEditing ? (
                <form onSubmit={handleSaveBiodata} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={editForm.nama}
                        onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Email Kantor</label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nomor Telepon HP</label>
                      <input
                        type="text"
                        required
                        value={editForm.noHp}
                        onChange={(e) => setEditForm({ ...editForm, noHp: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Alamat Instansi/Kantor</label>
                    <textarea
                      rows="3"
                      required
                      value={editForm.alamat}
                      onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#0B4A3F] hover:bg-[#083831] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md"
                  >
                    Simpan Profil Admin
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><User size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Nama Lengkap</p>
                        <h4 className="font-bold text-slate-800 text-xs">{profileData.user.nama}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Mail size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Alamat Email</p>
                        <h4 className="font-semibold text-slate-800 text-xs">{profileData.user.email}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><ShieldCheck size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Level Hak Akses</p>
                        <h4 className="font-extrabold text-[#D4AF37] text-xs">SERVER ADMINISTRATOR</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Phone size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Nomor HP</p>
                        <h4 className="font-semibold text-slate-800 text-xs">{profileData.user.noHp}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Calendar size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Tanggal Bergabung</p>
                        <h4 className="font-bold text-slate-800 text-xs">{formatTanggalIndo(profileData.user.createdAt)}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[#0B4A3F]"><Activity size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Terakhir Masuk</p>
                        <h4 className="font-bold text-slate-800 text-xs">Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Alamat Instansi/Kantor</p>
                    <p className="font-semibold text-slate-800 mt-1 leading-relaxed">{profileData.user.alamat}</p>
                  </div>

                  {/* LOG AKTIVITAS TERAKHIR ADMIN (Premium Feature) */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-[#0B4A3F] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <Activity size={15} className="text-[#D4AF37]" />
                      <span>Log Aktivitas Terakhir Server</span>
                    </h3>
                    <div className="space-y-2 text-[10px]">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">🟢 Anda memverifikasi pendaftaran santri baru <strong>Ahmad Fauzi</strong></span>
                        <span className="text-slate-400">1 jam yang lalu</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">🟡 Anda memperbarui data nilai akademik kelas <strong>Tsanawi 3</strong></span>
                        <span className="text-slate-400">Kemarin</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600">🔴 Anda mencatat sanksi disiplin sedang santri</span>
                        <span className="text-slate-400">20/07/2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sisi Kanan: Form Ganti Password (Hanya muncul jika melihat profilnya sendiri) */}
            <div className="lg:col-span-1 space-y-4">
              {isSelf && (
                <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
                  <h3 className="text-xs font-bold text-[#0B4A3F] uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                    <Key size={15} className="text-[#D4AF37]" />
                    <span>Ganti Kata Sandi</span>
                  </h3>

                  {pwdError && <p className="text-[#DC2626] text-[10px] font-semibold mb-3">⚠️ {pwdError}</p>}
                  {pwdSuccess && <p className="text-[#16A34A] text-[10px] font-semibold mb-3">✓ {pwdSuccess}</p>}

                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <input
                      type="password"
                      placeholder="Kata Sandi Lama"
                      value={passwordForm.passwordLama}
                      onChange={(e) => setPasswordForm({ ...passwordForm, passwordLama: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-[#D4AF37]"
                    />
                    <input
                      type="password"
                      placeholder="Kata Sandi Baru"
                      value={passwordForm.passwordBaru}
                      onChange={(e) => setPasswordForm({ ...passwordForm, passwordBaru: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-[#D4AF37]"
                    />
                    <input
                      type="password"
                      placeholder="Konfirmasi Sandi Baru"
                      value={passwordForm.konfirmasiPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasiPassword: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="w-full bg-[#0B4A3F] hover:bg-[#083831] text-white py-2 rounded-xl font-bold text-xs transition shadow-sm"
                    >
                      Perbarui Sandi
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

const getNamaBulan = (num) => {
  const listBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return listBulan[num - 1];
};

export default Profil;
