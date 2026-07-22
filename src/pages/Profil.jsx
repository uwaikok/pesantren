import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Key, BookOpen, ShieldAlert, DollarSign, Edit, Check, Camera, Loader2 } from 'lucide-react';
import api from '../utils/api';

function Profil({ user, onUserUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Deteksi target user ID. Jika ada param id (hanya boleh jika admin), tampilkan profil id tersebut.
  // Jika tidak ada param id, tampilkan profil user yang sedang login.
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

  // State untuk form edit biodata (jika admin)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    namaWali: '',
    alamat: '',
    kelas: ''
  });

  useEffect(() => {
    // RBAC: Jika santri mencoba melihat profil id lain, tolak dan redirect ke profil sendiri
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
      
      // Inisialisasi edit form
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

    // Validasi format file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFotoError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.');
      return;
    }

    // Validasi ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFotoError('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    setFotoLoading(true);
    setFotoError('');
    setFotoSuccess('');

    // Preview lokal dulu
    const localUrl = URL.createObjectURL(file);
    setPreviewFoto(localUrl);

    try {
      const useMock = localStorage.getItem('use_mock_db') === 'true' || window.useMockDb === true;

      if (useMock) {
        // Mock mode: simpan sebagai base64 di localStorage
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
          const idx = users.findIndex(u => u.id === targetId);
          if (idx !== -1) {
            users[idx].fotoProfil = base64;
            localStorage.setItem('mock_users', JSON.stringify(users));
            // Update token jika user yang diedit adalah diri sendiri
            if (targetId === user.id) {
              const tokenUser = JSON.parse(localStorage.getItem('simesra_token') || '{}');
              tokenUser.fotoProfil = base64;
              localStorage.setItem('simesra_token', JSON.stringify(tokenUser));
              // Update parent state untuk sidebar
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
        // Backend asli: kirim FormData
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
        // Update sidebar jika user yang diedit adalah diri sendiri
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

    if (passwordBaru !== konfirmasiPassword) {
      setPwdError('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    setPwdLoading(true);
    try {
      // Endpoint ubah password. Di demo mode kita update password di local storage
      const useMock = localStorage.getItem('use_mock_db') === 'true' || window.useMockDb === true;
      if (useMock) {
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const idx = users.findIndex(u => u.id === user.id);
        if (idx === -1) throw new Error('User tidak ditemukan');
        if (users[idx].password !== passwordLama) throw new Error('Kata sandi lama salah');
        
        users[idx].password = passwordBaru;
        localStorage.setItem('mock_users', JSON.stringify(users));
        // Update token
        localStorage.setItem('simesra_token', JSON.stringify(users[idx]));
      } else {
        // Panggil endpoint backend asli
        await api.put(`/admin/santri/${user.id}`, { password: passwordBaru });
      }

      setPwdSuccess('Kata sandi berhasil diperbarui!');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 rounded-xl text-sm font-medium">
        {error || 'Profil tidak dapat dimuat.'}
      </div>
    );
  }

  const isTargetAdmin = profileData.user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* HEADER CARD PROFIL */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          
          {/* FOTO PROFIL DENGAN TOMBOL GANTI */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-3xl shadow-lg border-4 border-white ring-2 ring-emerald-500/30">
              {(previewFoto || profileData.user.fotoProfil) ? (
                <img
                  src={previewFoto || (profileData.user.fotoProfil?.startsWith('data:') ? profileData.user.fotoProfil : `/${profileData.user.fotoProfil}`)}
                  alt={profileData.user.nama}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.querySelector('.foto-initial')?.classList.remove('hidden'); }}
                />
              ) : (
                <span className="foto-initial uppercase">{profileData.user.nama.charAt(0)}</span>
              )}
            </div>

            {/* Overlay kamera - tampil saat hover, hanya untuk diri sendiri atau admin */}
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
            <h1 className="text-xl font-bold text-slate-800 font-serif">{profileData.user.nama}</h1>
            <p className="text-xs text-slate-500 mt-1">{profileData.user.email}</p>
            <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                {profileData.user.role === 'ADMIN' ? 'Admin / Pengurus' : `Santri (${profileData.user.kelas || '-'})`}
              </span>
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                Status: {profileData.user.status}
              </span>
            </div>
            {/* Notifikasi foto profil */}
            {fotoSuccess && (
              <p className="text-emerald-600 text-[10px] font-semibold mt-1.5 flex items-center gap-1">
                <Check size={12} /> {fotoSuccess}
              </p>
            )}
            {fotoError && (
              <p className="text-rose-600 text-[10px] font-semibold mt-1.5">⚠️ {fotoError}</p>
            )}
            {(isSelf || user.role === 'ADMIN') && !fotoSuccess && !fotoError && (
              <p className="text-slate-400 text-[9px] mt-1.5">📷 Arahkan kursor ke foto untuk mengganti</p>
            )}
          </div>
          {user.role === 'ADMIN' && !isTargetAdmin && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition border border-emerald-200 flex items-center space-x-1"
            >
              <Edit size={14} />
              <span>{isEditing ? 'Batal Edit' : 'Edit Biodata'}</span>
            </button>
          )}
        </div>
      </div>

      {/* PROFIL SEBAGAI SANTRI (TAMPILKAN TAB) */}
      {!isTargetAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* TABS SIDE BAR */}
          <div className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 text-xs">
            <button
              onClick={() => setActiveTab('pribadi')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition ${
                activeTab === 'pribadi'
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-600/10'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <User size={16} />
              <span>Biodata Santri</span>
            </button>
            <button
              onClick={() => setActiveTab('akademik')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition ${
                activeTab === 'akademik'
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-600/10'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <BookOpen size={16} />
              <span>Riwayat Akademik</span>
            </button>
            <button
              onClick={() => setActiveTab('keamanan')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition ${
                activeTab === 'keamanan'
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-600/10'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert size={16} />
              <span>Riwayat Kedisiplinan</span>
            </button>
            <button
              onClick={() => setActiveTab('keuangan')}
              className={`flex-1 lg:flex-none flex items-center space-x-2.5 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition ${
                activeTab === 'keuangan'
                  ? 'bg-emerald-600 text-white shadow shadow-emerald-600/10'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <DollarSign size={16} />
              <span>Buku Syariah</span>
            </button>
          </div>

          {/* CONTENT PANEL */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
            {/* TAB: PRIBADI */}
            {activeTab === 'pribadi' && (
              <div className="space-y-6">
                <h2 className="text-base font-bold text-slate-800 font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <User size={18} className="text-emerald-600" />
                  <span>Biodata Data Diri Santri</span>
                </h2>

                {isEditing ? (
                  <form onSubmit={handleSaveBiodata} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={editForm.nama}
                          onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">No. HP</label>
                        <input
                          type="text"
                          required
                          value={editForm.noHp}
                          onChange={(e) => setEditForm({ ...editForm, noHp: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Wali</label>
                        <input
                          type="text"
                          required
                          value={editForm.namaWali}
                          onChange={(e) => setEditForm({ ...editForm, namaWali: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Kelas</label>
                        <input
                          type="text"
                          required
                          value={editForm.kelas}
                          onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Alamat Lengkap</label>
                      <textarea
                        rows="3"
                        required
                        value={editForm.alamat}
                        onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none resize-none"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition"
                    >
                      Simpan Perubahan
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><User size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</p>
                          <p className="font-bold text-slate-800">{profileData.user.nama}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Mail size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat Email</p>
                          <p className="font-semibold text-slate-800">{profileData.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Phone size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Nomor HP</p>
                          <p className="font-semibold text-slate-800">{profileData.user.noHp}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><User size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Orang Tua / Wali</p>
                          <p className="font-bold text-slate-800">{profileData.user.namaWali || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3.5">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><MapPin size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat Rumah</p>
                          <p className="font-semibold text-slate-800">{profileData.user.alamat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GANTI PASSWORD (Hanya jika melihat profil sendiri) */}
                {isSelf && (
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                      <Key size={16} className="text-amber-500" />
                      <span>Ubah Kata Sandi Akun</span>
                    </h3>

                    {pwdError && <p className="text-rose-600 text-xs font-semibold mb-3">⚠️ {pwdError}</p>}
                    {pwdSuccess && <p className="text-emerald-700 text-xs font-semibold mb-3">✓ {pwdSuccess}</p>}

                    <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="password"
                        placeholder="Kata Sandi Lama"
                        value={passwordForm.passwordLama}
                        onChange={(e) => setPasswordForm({ ...passwordForm, passwordLama: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <input
                        type="password"
                        placeholder="Kata Sandi Baru"
                        value={passwordForm.passwordBaru}
                        onChange={(e) => setPasswordForm({ ...passwordForm, passwordBaru: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Konfirmasi Sandi Baru"
                          value={passwordForm.konfirmasiPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasiPassword: e.target.value })}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={pwdLoading}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-4 rounded-lg font-bold text-xs"
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
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-800 font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <BookOpen size={18} className="text-emerald-600" />
                  <span>Riwayat Studi Rapor Santri</span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <th className="py-2.5 px-3">Tahun Ajaran</th>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3">Mata Pelajaran</th>
                        <th className="py-2.5 px-3 text-center">UTS</th>
                        <th className="py-2.5 px-3 text-center">UAS</th>
                        <th className="py-2.5 px-3 text-center">Rata-Rata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profileData.akademik.length > 0 ? (
                        profileData.akademik.map((n) => (
                          <tr key={n.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-700">{n.tahunAjaran}</td>
                            <td className="py-2 px-3">{n.semester}</td>
                            <td className="py-2 px-3 text-slate-800 font-medium">{n.mataPelajaran}</td>
                            <td className="py-2 px-3 text-center">{n.nilaiUts}</td>
                            <td className="py-2 px-3 text-center">{n.nilaiUas}</td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-800">
                              {((n.nilaiUts + n.nilaiUas) / 2).toFixed(1)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-6 text-center text-slate-400">Belum ada riwayat akademik tercatat.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: KEAMANAN */}
            {activeTab === 'keamanan' && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-800 font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <span>Daftar Pelanggaran Disiplin</span>
                </h2>

                <div className="space-y-3">
                  {profileData.keamanan.length > 0 ? (
                    profileData.keamanan.map((s) => (
                      <div key={s.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50 flex items-start space-x-3 text-xs leading-relaxed">
                        <div className="mt-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            s.kategori === 'RINGAN' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            s.kategori === 'SEDANG' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-rose-100 text-rose-800 border-rose-200'
                          }`}>
                            {s.kategori}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {new Date(s.tanggalPelanggaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          <p className="text-slate-650 mt-1">{s.deskripsi}</p>
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
                <h2 className="text-base font-bold text-slate-800 font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <DollarSign size={18} className="text-emerald-600" />
                  <span>Resume Buku Syariah ({profileData.keuangan.tahun})</span>
                </h2>

                {/* Arrears summary card */}
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-rose-800 uppercase">Sisa Tunggakan Syariah</span>
                    <p className="text-slate-500 mt-0.5">Seluruh bulan belum terbayar di tahun {profileData.keuangan.tahun}</p>
                  </div>
                  <h3 className="text-lg font-extrabold text-rose-600">
                    Rp {profileData.keuangan.totalTunggakan.toLocaleString('id-ID')}
                  </h3>
                </div>

                {/* 12 Months checklist list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                  {profileData.keuangan.payments.map((p) => {
                    const isPaid = p.status === 'LUNAS';
                    return (
                      <div 
                        key={p.bulan}
                        className={`border rounded-xl p-3 flex items-center justify-between border-slate-200 ${
                          isPaid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-700">{getNamaBulan(p.bulan)}</p>
                          <p className="text-slate-400 mt-0.5">Rp {p.jumlah.toLocaleString('id-ID')}</p>
                        </div>
                        <span className={`font-bold uppercase text-[8px] rounded px-1.5 ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
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
        /* PROFIL SEBAGAI ADMIN (TIDAK TAMPILKAN TAB DATA SANTRI) */
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 font-serif border-b border-slate-100 pb-3 flex items-center space-x-2">
            <User size={18} className="text-emerald-600" />
            <span>Informasi Detail Akun Pengurus</span>
          </h2>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nama Pengguna</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{profileData.user.nama}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Level Akses</p>
                  <p className="font-bold text-emerald-800 text-sm mt-0.5">SERVER ADMIN (RBAC FULL)</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat Email</p>
                  <p className="font-semibold text-slate-850 mt-0.5">{profileData.user.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nomor Telepon</p>
                  <p className="font-semibold text-slate-850 mt-0.5">{profileData.user.noHp}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat Instansi/Kantor</p>
                <p className="font-semibold text-slate-800 mt-0.5">{profileData.user.alamat}</p>
              </div>
            </div>

            {/* GANTI PASSWORD (Hanya jika melihat profil sendiri) */}
            {isSelf && (
              <div className="md:col-span-1 bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                  <Key size={15} className="text-amber-500" />
                  <span>Ganti Kata Sandi</span>
                </h3>

                {pwdError && <p className="text-rose-600 text-[10px] font-semibold mb-3">⚠️ {pwdError}</p>}
                {pwdSuccess && <p className="text-emerald-700 text-[10px] font-semibold mb-3">✓ {pwdSuccess}</p>}

                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Kata Sandi Lama"
                    value={passwordForm.passwordLama}
                    onChange={(e) => setPasswordForm({ ...passwordForm, passwordLama: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    placeholder="Kata Sandi Baru"
                    value={passwordForm.passwordBaru}
                    onChange={(e) => setPasswordForm({ ...passwordForm, passwordBaru: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    placeholder="Konfirmasi Sandi Baru"
                    value={passwordForm.konfirmasiPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasiPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-bold text-xs transition"
                  >
                    Perbarui Sandi
                  </button>
                </form>
              </div>
            )}
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
