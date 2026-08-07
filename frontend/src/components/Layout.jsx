import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShieldAlert, 
  DollarSign, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  UserPlus,
  Sparkles,
  Users,
  Bell,
  Trash2,
  Pencil
} from 'lucide-react';
import api from '../utils/api';
import { alertDialog } from '../utils/dialog';

function Layout({ children, user, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // State untuk Notifikasi Lonceng
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const mobileNotifRef = useRef(null); // Ref untuk dropdown notifikasi mobile
  const desktopNotifRef = useRef(null); // Ref untuk dropdown notifikasi desktop
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // State untuk Modal Pengiriman Notifikasi oleh Admin
  const [isAdminNotifModalOpen, setIsAdminNotifModalOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ judul: '', isi: '', kategori: 'UMUM', santriId: '' });
  const [allSantri, setAllSantri] = useState([]);

  // State untuk Hapus Notifikasi Inline
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeletingNotif, setIsDeletingNotif] = useState(false);

  // State untuk Modal Edit Notifikasi oleh Admin
  const [isEditNotifModalOpen, setIsEditNotifModalOpen] = useState(false);
  const [editNotifData, setEditNotifData] = useState({ id: null, judul: '', isi: '', kategori: 'UMUM', santriId: '' });

  // State untuk Modal Detail Pengumuman (saat notif diklik)
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Buka modal detail pengumuman
  const handleOpenNotifDetail = (notif) => {
    setSelectedNotif(notif);
    setIsNotifOpen(false); // Tutup dropdown dulu
    // Auto mark as read
    if (user.role === 'SANTRI') {
      handleMarkSingleRead(notif.id);
    } else if (user.role === 'ADMIN') {
      handleMarkAdminNotifRead(notif.id);
    }
  };

  // Tutup dropdown notifikasi saat klik di luar area notifikasi
  // Menggunakan dua ref terpisah agar mobile & desktop tidak saling konflik
  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideMobile = mobileNotifRef.current && mobileNotifRef.current.contains(e.target);
      const insideDesktop = desktopNotifRef.current && desktopNotifRef.current.contains(e.target);
      if (!insideMobile && !insideDesktop) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      // Gunakan 'mouseup' & 'touchend' (bukan mousedown/touchstart)
      // agar user bisa berinteraksi penuh sebelum event close dipicu
      document.addEventListener('mouseup', handleClickOutside);
      document.addEventListener('touchend', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [isNotifOpen]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      if (user.role === 'ADMIN') {
        fetchAllSantri();
      }
    }

    // Saat user klik notifikasi HP dan app kembali ke foreground, refresh notifikasi
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchNotifications();
      }
    };

    // Buka dropdown lonceng ketika dipicu oleh klik notifikasi dari Android
    const handleOpenNotifEvent = async () => {
      navigate('/');        // Navigasi ke halaman beranda
      try {
        const data = await api.get('/notifications');
        setNotifications(data);
        // Tampilkan notifikasi DB terbaru (bukan notifikasi dinamis string id)
        if (data && data.length > 0) {
          // Cari notifikasi DB asli (id numerik) - yang dikirim oleh admin
          const dbNotif = data.find(n => typeof n.id === 'number');
          setSelectedNotif(dbNotif || data[0]);
        } else {
          setIsNotifOpen(true); // Fallback: buka dropdown
        }
      } catch {
        setIsNotifOpen(true); // Fallback jika gagal fetch
      }
    };

    // Cek sessionStorage: jika ada flag dari Android (kasus app baru terbuka)
    if (sessionStorage.getItem('openNotificationsOnLoad') === 'true') {
      sessionStorage.removeItem('openNotificationsOnLoad');
      setTimeout(async () => {
        navigate('/');
        try {
          const data = await api.get('/notifications');
          setNotifications(data);
          if (data && data.length > 0) {
            const dbNotif = data.find(n => typeof n.id === 'number');
            setSelectedNotif(dbNotif || data[0]);
          } else {
            setIsNotifOpen(true);
          }
        } catch {
          setIsNotifOpen(true);
        }
      }, 500);
    }

    const handleRefreshNotifs = () => {
      fetchNotifications();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('openNotifications', handleOpenNotifEvent);
    window.addEventListener('refreshNotifications', handleRefreshNotifs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('openNotifications', handleOpenNotifEvent);
      window.removeEventListener('refreshNotifications', handleRefreshNotifs);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
      if (user.role === 'SANTRI') {
        const readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
        const unread = data.filter(n => {
          return !readNotifs.includes(String(n.id)) && !n.isRead;
        });
        setUnreadCount(unread.length);
      } else if (user.role === 'ADMIN') {
        const readAdminNotifs = JSON.parse(localStorage.getItem(`read_notifs_admin_${user.id}`) || '[]');
        const unread = data.filter(n => {
          return !readAdminNotifs.includes(String(n.id));
        });
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error('Gagal mengambil notifikasi:', err);
    }
  };

  const fetchAllSantri = async () => {
    try {
      const data = await api.get('/admin/santri');
      setAllSantri(data);
    } catch (err) {
      console.error('Gagal mengambil daftar santri:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      if (user.role === 'SANTRI') {
        if (typeof id === 'number') {
          await api.put('/notifications/read', { id });
        }
        const readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
        if (!readNotifs.includes(String(id))) {
          readNotifs.push(String(id));
        }
        localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(readNotifs));
        fetchNotifications();
      }
    } catch (err) {
      console.error('Gagal menandai dibaca:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (user.role === 'SANTRI') {
        await api.put('/notifications/read');
        const allIds = notifications.map(n => String(n.id));
        localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(allIds));
        fetchNotifications();
      } else if (user.role === 'ADMIN') {
        const allIds = notifications.map(n => String(n.id));
        localStorage.setItem(`read_notifs_admin_${user.id}`, JSON.stringify(allIds));
        fetchNotifications();
      }
    } catch (err) {
      console.error('Gagal menandai semua dibaca:', err);
    }
  };

  const handleOpenEditNotif = (n) => {
    setEditNotifData({
      id: n.id,
      judul: n.judul,
      isi: n.isi,
      kategori: n.kategori || 'UMUM',
      santriId: n.santriId ? String(n.santriId) : ''
    });
    setIsEditNotifModalOpen(true);
    setIsNotifOpen(false);
  };

  const handleEditNotification = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/notifications/${editNotifData.id}`, {
        judul: editNotifData.judul,
        isi: editNotifData.isi,
        kategori: editNotifData.kategori,
        santriId: editNotifData.santriId ? parseInt(editNotifData.santriId) : null
      });
      setIsEditNotifModalOpen(false);
      setEditNotifData({ id: null, judul: '', isi: '', kategori: 'UMUM', santriId: '' });
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      alertDialog('Pemberitahuan berhasil diperbarui!', 'Berhasil');
    } catch (err) {
      alertDialog(err.message || 'Gagal memperbarui pemberitahuan', 'Gagal');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications', {
        judul: notifForm.judul,
        isi: notifForm.isi,
        kategori: notifForm.kategori,
        santriId: notifForm.santriId ? parseInt(notifForm.santriId) : null
      });
      setIsAdminNotifModalOpen(false);
      setNotifForm({ judul: '', isi: '', kategori: 'UMUM', santriId: '' });
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      alertDialog('Notifikasi berhasil dikirim!', 'Berhasil');
    } catch (err) {
      alertDialog(err.message || 'Gagal mengirim notifikasi', 'Gagal');
    }
  };

  const handleDeleteNotification = async (id) => {
    setIsDeletingNotif(true);
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
      setConfirmDeleteId(null);
      alertDialog('Pemberitahuan berhasil dihapus!', 'Berhasil');
    } catch (err) {
      alertDialog(err.message || 'Gagal menghapus notifikasi', 'Gagal');
    } finally {
      setIsDeletingNotif(false);
    }
  };

  // Memetakan rute ke label breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ label: 'Beranda', path: '/' }];

    if (path === '/pendidikan') {
      crumbs.push({ label: 'Modul Akademik & Pendidikan', path: '/pendidikan' });
    } else if (path === '/kelas') {
      crumbs.push({ label: 'Kelas / Rombel', path: '/kelas' });
    } else if (path === '/keamanan') {
      crumbs.push({ label: 'Modul Keamanan & Sanksi', path: '/keamanan' });
    } else if (path === '/keuangan') {
      crumbs.push({ label: 'Modul Bendahara & Syariah', path: '/keuangan' });
    } else if (path.startsWith('/profil')) {
      crumbs.push({ label: 'Profil Akun', path: '/profil' });
    } else if (path === '/tambah-santri') {
      crumbs.push({ label: 'Tambah Santri Baru', path: '/tambah-santri' });
    } else if (path === '/kirim-pemberitahuan') {
      crumbs.push({ label: 'Kirim Pemberitahuan', path: '/kirim-pemberitahuan' });
    }

    return crumbs;
  };

  const navItems = [
    { label: 'Beranda', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Pendidikan', path: '/pendidikan', icon: BookOpen, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Kelas / Rombel', path: '/kelas', icon: Users, roles: ['ADMIN'] },
    { label: 'Keamanan', path: '/keamanan', icon: ShieldAlert, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Bendahara', path: '/keuangan', icon: DollarSign, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Kirim Pemberitahuan', path: '/kirim-pemberitahuan', icon: Bell, roles: ['ADMIN'] },
    { label: 'Profil', path: '/profil', icon: User, roles: ['ADMIN', 'SANTRI'] },
  ];

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));
  const isTambahSantriActive = location.pathname === '/tambah-santri';

  // Perubahan profil untuk notifikasi Admin
  const profileChangeNotifs = notifications.filter(n => n.judul && n.judul.includes('Perubahan Profil'));
  const readAdminNotifs = JSON.parse(localStorage.getItem(`read_notifs_admin_${user?.id}`) || '[]');
  const unreadProfileNotifs = profileChangeNotifs.filter(n => !readAdminNotifs.includes(String(n.id)));
  const unreadProfileNotifsCount = unreadProfileNotifs.length;

  const handleMarkAdminNotifRead = (id) => {
    const readAdminNotifs = JSON.parse(localStorage.getItem(`read_notifs_admin_${user?.id}`) || '[]');
    if (!readAdminNotifs.includes(String(id))) {
      readAdminNotifs.push(String(id));
      localStorage.setItem(`read_notifs_admin_${user?.id}`, JSON.stringify(readAdminNotifs));
      fetchNotifications();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col md:flex-row text-[#1A1A1A]">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#0B4A3F] via-[#094137] to-[#083831] text-white shadow-2xl flex-shrink-0 no-print border-r border-[#D4AF37]/20 relative">
        {/* Subtle accent border line */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-[#D4AF37] via-[#E8C766]/30 to-transparent"></div>

        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 bg-[#083831]/80 flex items-center space-x-3">
          <div className="p-1.5 bg-[#0B4A3F] border border-[#D4AF37]/50 rounded-xl shadow-inner relative group">
            <img src="/logo.png" className="w-9 h-9 object-contain drop-shadow" alt="Logo Pesantren" />
            <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition duration-300"></div>
          </div>
          <div>
            <h1 className="font-extrabold text-base font-serif tracking-wide text-white leading-tight">
              Miftahul Huda
            </h1>
            <p className="text-[10px] text-[#E8C766] font-semibold tracking-wider uppercase">As-Syadzili • SIM</p>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-b border-white/10 bg-[#083831]/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#0B4A3F] flex items-center justify-center font-bold text-white uppercase text-base border-2 border-[#D4AF37] shadow-md overflow-hidden relative">
              {user?.fotoProfil ? (
                <img
                  src={user.fotoProfil.startsWith('data:') ? user.fotoProfil : `/${user.fotoProfil}`}
                  alt={user.nama}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                user?.nama?.charAt(0)
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-xs text-white truncate font-sans">{user?.nama}</h2>
              <span className="inline-flex items-center space-x-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#E8C766] border border-[#D4AF37]/40 uppercase mt-1">
                <Sparkles size={10} />
                <span>{user?.role === 'ADMIN' ? 'Server / Admin' : `Santri ${user?.kelas || ''}`}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#083831] text-white shadow-lg border-l-4 border-[#D4AF37] translate-x-1'
                    : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#E8C766]' : 'text-emerald-200/80'} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Tombol Tambah Santri Baru (Aksi Khusus) */}
          {user?.role === 'ADMIN' && (
            <div className="pt-3 mt-1 border-t border-white/10">
              <Link
                to="/tambah-santri"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isTambahSantriActive
                    ? 'bg-[#D4AF37] text-[#083831] shadow-lg'
                    : 'bg-[#D4AF37]/15 text-[#E8C766] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40'
                }`}
              >
                <UserPlus size={18} className={isTambahSantriActive ? 'text-[#083831]' : 'text-[#E8C766]'} />
                <span>Tambah Santri Baru</span>
              </Link>
            </div>
          )}
        </nav>



        {/* Logout Button */}
        <div className="p-4 border-t border-white/10 bg-[#083831]">
          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 rounded-xl transition-all border border-rose-500/20"
          >
            <LogOut size={16} />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header 
        style={{ paddingTop: 'calc(0.875rem + env(safe-area-inset-top))' }}
        className="md:hidden bg-[#0B4A3F] text-white pb-3.5 px-3.5 flex items-center justify-between shadow-md no-print z-30 sticky top-0 border-b border-[#D4AF37]/30"
      >
        <div className="flex items-center space-x-2.5">
          <img src="/logo.png" className="w-7 h-7 object-contain drop-shadow" alt="Logo" />
          <div>
            <span className="font-bold text-xs tracking-wide text-white font-serif block leading-tight">SIM Pesantren</span>
            <span className="text-[9px] text-[#E8C766] font-semibold">Miftahul Huda As-Syadzili</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 relative" ref={mobileNotifRef}>
          {/* Ikon Lonceng Mobile */}
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-[#E8C766] hover:text-white hover:bg-white/10 rounded-lg transition relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-[8px] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Notifikasi Mobile */}
          {isNotifOpen && (
            <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-xs text-[#1A1A1A]">
              <div className="p-3 bg-[#0B4A3F] text-white font-bold flex items-center justify-between border-b border-[#D4AF37]/30">
                <span className="flex items-center space-x-1 font-serif">
                  <Bell size={12} />
                  <span>Notifikasi SIM</span>
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-[9px] text-emerald-250 hover:text-white font-medium underline"
                  >
                    Semua Dibaca
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map(n => {
                    let iconBg = 'bg-slate-100 text-slate-600 border border-slate-250';
                    let badgeLabel = 'UMUM';
                    if (n.kategori === 'UJIAN') {
                      iconBg = 'bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20';
                      badgeLabel = 'UJIAN';
                    } else if (n.kategori === 'SPP') {
                      iconBg = 'bg-amber-100 text-amber-700 border border-amber-500/20';
                      badgeLabel = 'BULANAN';
                    } else if (n.kategori === 'KEAMANAN') {
                      iconBg = 'bg-rose-100 text-rose-700 border border-rose-500/20';
                      badgeLabel = 'SANKSI';
                    }

                    const readNotifs = user.role === 'ADMIN'
                      ? JSON.parse(localStorage.getItem(`read_notifs_admin_${user.id}`) || '[]')
                      : JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
                    const isRead = readNotifs.includes(String(n.id)) || (user.role === 'SANTRI' && n.isRead);

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpenNotifDetail(n)}
                        className={`p-3 cursor-pointer hover:bg-emerald-50/60 transition-colors duration-150 ${!isRead && user.role === 'SANTRI' ? 'bg-slate-50/80 font-medium' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide inline-block ${iconBg}`}>
                            {badgeLabel}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[8px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            {!isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mt-1 leading-tight text-[10px]">{n.judul}</h4>
                        <p className="text-slate-500 mt-0.5 text-[9px] leading-relaxed line-clamp-2">{n.isi}</p>
                        <p className="text-[8px] text-emerald-600 font-bold mt-1">Tap untuk baca selengkapnya →</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <p className="text-xs">Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => { setIsSidebarOpen(!isSidebarOpen); setIsNotifOpen(false); }}
            className="p-2 text-[#E8C766] hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR - MOBILE DRAWER */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          <div className="fixed inset-0 bg-[#083831]/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className="relative flex flex-col w-64 bg-[#0B4A3F] text-white shadow-2xl z-10 animate-slide-in border-r border-[#D4AF37]/30">
            <div 
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
              className="p-4 border-b border-white/10 bg-[#083831] flex items-center justify-between"
            >
              <span className="font-bold text-xs font-serif text-[#E8C766] uppercase tracking-wider">Menu Navigasi</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-emerald-200 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-white/10 bg-[#083831]/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#0B4A3F] flex items-center justify-center font-bold text-white uppercase border border-[#D4AF37] overflow-hidden">
                  {user?.fotoProfil ? (
                    <img
                      src={user.fotoProfil.startsWith('data:') ? user.fotoProfil : `/${user.fotoProfil}`}
                      alt={user.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    user?.nama?.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-xs text-white">{user?.nama}</h2>
                  <span className="inline-block text-[9px] font-bold px-2 rounded-full bg-[#D4AF37]/20 text-[#E8C766] border border-[#D4AF37]/30 uppercase mt-0.5">
                    {user?.role === 'ADMIN' ? 'Server / Admin' : `Santri ${user?.kelas || ''}`}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#083831] text-white border-l-4 border-[#D4AF37]'
                        : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#E8C766]' : 'text-emerald-200/80'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Tombol Tambah Santri Mobile */}
              {user?.role === 'ADMIN' && (
                <div className="pt-3 mt-1 border-t border-white/10">
                  <Link
                    to="/tambah-santri"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      isTambahSantriActive
                        ? 'bg-[#D4AF37] text-[#083831]'
                        : 'bg-[#D4AF37]/15 text-[#E8C766] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40'
                    }`}
                  >
                    <UserPlus size={18} className={isTambahSantriActive ? 'text-[#083831]' : 'text-[#E8C766]'} />
                    <span>Tambah Santri Baru</span>
                  </Link>
                </div>
              )}
            </nav>
            <div className="p-4 border-t border-white/10 bg-[#083831]">
              <button
                onClick={handleLogoutClick}
                className="flex items-center space-x-3 w-full px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-950/40 rounded-xl transition"
              >
                <LogOut size={16} />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Desktop */}
        <header className="hidden md:flex bg-white h-16 border-b border-slate-200/80 items-center justify-between px-8 no-print shadow-sm">
          <div className="flex items-center text-xs font-bold text-slate-500 space-x-2">
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <ChevronRight size={14} className="text-slate-300" />}
                <Link to={crumb.path} className={`hover:text-[#0B4A3F] transition ${idx === getBreadcrumbs().length - 1 ? 'text-[#0B4A3F] font-extrabold' : ''}`}>
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex items-center space-x-5">
            {/* Ikon Lonceng Desktop */}
            <div className="relative" ref={desktopNotifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:text-[#0B4A3F] hover:bg-slate-100 rounded-full transition relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-[8px] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notifikasi Desktop */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden text-xs text-[#1A1A1A]">
                  <div className="p-3.5 bg-[#0B4A3F] text-white font-bold font-serif flex items-center justify-between border-b border-[#D4AF37]/30">
                    <span className="flex items-center space-x-1.5">
                      <Bell size={14} className="text-[#D4AF37]" />
                      <span>Notifikasi SIM</span>
                    </span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="text-[10px] text-emerald-250 hover:text-white font-sans font-semibold underline transition duration-150"
                      >
                        Tandai Semua Dibaca
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map(n => {
                        let iconBg = 'bg-slate-100 text-slate-600 border border-slate-250';
                        let badgeLabel = 'UMUM';
                        if (n.kategori === 'UJIAN') {
                          iconBg = 'bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20';
                          badgeLabel = 'UJIAN';
                        } else if (n.kategori === 'SPP') {
                          iconBg = 'bg-amber-100 text-amber-700 border border-amber-500/20';
                          badgeLabel = 'BULANAN';
                        } else if (n.kategori === 'KEAMANAN') {
                          iconBg = 'bg-rose-100 text-rose-700 border border-rose-500/20';
                          badgeLabel = 'SANKSI';
                        }

                        const readNotifs = user.role === 'ADMIN'
                          ? JSON.parse(localStorage.getItem(`read_notifs_admin_${user.id}`) || '[]')
                          : JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
                        const isRead = readNotifs.includes(String(n.id)) || (user.role === 'SANTRI' && n.isRead);

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleOpenNotifDetail(n)}
                            className={`p-3.5 cursor-pointer hover:bg-emerald-50/60 transition-colors duration-150 ${!isRead && user.role === 'SANTRI' ? 'bg-slate-50/80' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase inline-block ${iconBg}`}>
                                {badgeLabel}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <h4 className="font-bold text-slate-800 mt-1 text-[11px] leading-tight">{n.judul}</h4>
                            <p className="text-slate-500 mt-1 text-[10px] leading-relaxed line-clamp-2">{n.isi}</p>
                            <p className="text-[9px] text-emerald-600 font-bold mt-1">Klik untuk baca selengkapnya →</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <p className="text-xs">Tidak ada notifikasi</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium pl-5 border-l border-slate-200">
              <span className="font-serif text-[#0B4A3F] font-bold">Miftahul Huda As-Syadzili</span>
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* BREADCRUMB (Mobile) */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center text-xs text-slate-500 no-print">
          {getBreadcrumbs().map((crumb, index, arr) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <ChevronRight size={10} className="mx-1 text-slate-300" />}
              <span className={index === arr.length - 1 ? 'font-bold text-[#0B4A3F]' : ''}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* MAIN CONTAINER */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* MODAL KIRIM NOTIFIKASI ADMIN */}
      {isAdminNotifModalOpen && (
        <div className="fixed inset-0 bg-[#083831]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#D4AF37]/30">
            <div className="p-5 bg-[#0B4A3F] text-white font-serif font-bold text-sm md:text-base flex justify-between items-center border-b border-[#D4AF37]/30">
              <span className="flex items-center space-x-2">
                <Bell size={18} className="text-[#D4AF37]" />
                <span>Kirim Pemberitahuan Baru</span>
              </span>
              <button 
                onClick={() => setIsAdminNotifModalOpen(false)}
                className="text-emerald-250 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSendNotification} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Judul Pemberitahuan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Ujian Akhir Semester"
                  value={notifForm.judul}
                  onChange={(e) => setNotifForm({ ...notifForm, judul: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kategori</label>
                <select
                  value={notifForm.kategori}
                  onChange={(e) => setNotifForm({ ...notifForm, kategori: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none font-bold text-slate-700"
                >
                  <option value="UMUM">UMUM (Pemberitahuan Biasa)</option>
                  <option value="UJIAN">UJIAN (Pengumuman Ujian/Akademik)</option>
                  <option value="SPP">SPP (Pengumuman Syariah/Bulanan)</option>
                  <option value="KEAMANAN">KEAMANAN (Pemberitahuan Disiplin/Sanksi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Target Penerima</label>
                <select
                  value={notifForm.santriId}
                  onChange={(e) => setNotifForm({ ...notifForm, santriId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none text-slate-700"
                >
                  <option value="">Semua Santri (Global)</option>
                  {allSantri.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas || 'Tanpa Kelas'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Isi Pemberitahuan</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tulis detail pengumuman yang ingin disampaikan..."
                  value={notifForm.isi}
                  onChange={(e) => setNotifForm({ ...notifForm, isi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminNotifModalOpen(false)}
                  className="flex-1 py-2.5 text-center font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-center font-bold bg-[#0B4A3F] hover:bg-[#083831] text-white rounded-xl shadow-sm transition"
                >
                  Kirim Notifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT NOTIFIKASI ADMIN */}
      {isEditNotifModalOpen && (
        <div className="fixed inset-0 bg-[#083831]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#D4AF37]/30">
            <div className="p-5 bg-[#0B4A3F] text-white font-serif font-bold text-sm md:text-base flex justify-between items-center border-b border-[#D4AF37]/30">
              <span className="flex items-center space-x-2">
                <Pencil size={18} className="text-[#D4AF37]" />
                <span>Edit Pemberitahuan</span>
              </span>
              <button 
                onClick={() => setIsEditNotifModalOpen(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditNotification} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Judul Pemberitahuan</label>
                <input
                  type="text"
                  required
                  value={editNotifData.judul}
                  onChange={(e) => setEditNotifData({ ...editNotifData, judul: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Kategori</label>
                <select
                  value={editNotifData.kategori}
                  onChange={(e) => setEditNotifData({ ...editNotifData, kategori: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none font-bold text-slate-700"
                >
                  <option value="UMUM">UMUM (Pemberitahuan Biasa)</option>
                  <option value="UJIAN">UJIAN (Pengumuman Ujian/Akademik)</option>
                  <option value="SPP">SPP (Pengumuman Syariah/Bulanan)</option>
                  <option value="KEAMANAN">KEAMANAN (Pemberitahuan Disiplin/Sanksi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Target Penerima</label>
                <select
                  value={editNotifData.santriId}
                  onChange={(e) => setEditNotifData({ ...editNotifData, santriId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none text-slate-700"
                >
                  <option value="">Semua Santri (Global)</option>
                  {allSantri.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas || 'Tanpa Kelas'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Isi Pemberitahuan</label>
                <textarea
                  required
                  rows={4}
                  value={editNotifData.isi}
                  onChange={(e) => setEditNotifData({ ...editNotifData, isi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditNotifModalOpen(false)}
                  className="flex-1 py-2.5 text-center font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-center font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DETAIL PENGUMUMAN - muncul saat notifikasi diklik (web maupun Android) */}
      {selectedNotif && (
        <div
          className="fixed inset-0 bg-[#083831]/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#D4AF37]/30 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal berdasarkan kategori */}
            {(() => {
              const kat = selectedNotif.kategori;
              let headerGradient = 'from-[#0B4A3F] to-[#083831]';
              let badgeBg = 'bg-slate-100 text-slate-700';
              let badgeLabel = 'UMUM';
              let emoji = '📢';
              if (kat === 'UJIAN') {
                headerGradient = 'from-emerald-700 to-emerald-900';
                badgeBg = 'bg-emerald-100 text-emerald-800';
                badgeLabel = 'UJIAN / AKADEMIK';
                emoji = '📚';
              } else if (kat === 'SPP') {
                headerGradient = 'from-amber-700 to-amber-900';
                badgeBg = 'bg-amber-100 text-amber-800';
                badgeLabel = 'SYARIAH / BULANAN';
                emoji = '💳';
              } else if (kat === 'KEAMANAN') {
                headerGradient = 'from-rose-700 to-rose-900';
                badgeBg = 'bg-rose-100 text-rose-800';
                badgeLabel = 'KEAMANAN / SANKSI';
                emoji = '🛡️';
              }
              return (
                <>
                  <div className={`p-5 bg-gradient-to-r ${headerGradient} text-white flex justify-between items-center border-b border-white/20`}>
                    <div className="flex items-center space-x-2.5">
                      <div className="text-2xl">{emoji}</div>
                      <div>
                        <p className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1 ${badgeBg}`}>
                          {badgeLabel}
                        </p>
                        <h3 className="font-serif font-bold text-sm leading-tight">{selectedNotif.judul}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="text-white/70 hover:text-white text-xl font-bold flex-shrink-0 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(selectedNotif.createdAt).toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNotif.isi}</p>
                    </div>
                    {user.role === 'ADMIN' && typeof selectedNotif.id !== 'string' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => { handleOpenEditNotif(selectedNotif); setSelectedNotif(null); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200"
                        >
                          <Pencil size={12} />
                          Edit Pengumuman
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(selectedNotif.id); setSelectedNotif(null); setIsNotifOpen(true); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition border border-rose-200"
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="w-full py-3 bg-[#0B4A3F] hover:bg-[#083831] text-white font-bold text-xs rounded-xl transition shadow-sm"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;

