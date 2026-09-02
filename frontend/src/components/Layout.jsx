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
  Pencil,
  UserCheck
} from 'lucide-react';
import api from '../utils/api';
import { alertDialog, confirmDialog } from '../utils/dialog';

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

  // State untuk Badge Pendaftaran Akun Pending (Admin)
  const [pendingRegCount, setPendingRegCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchPendingCount();
    }
  }, [user, location.pathname]);

  const fetchPendingCount = async () => {
    try {
      const data = await api.get('/admin/pendaftaran');
      if (Array.isArray(data)) {
        setPendingRegCount(data.filter(i => i.status === 'PENDING').length);
      }
    } catch (err) {
      console.warn('Gagal memuat count pendaftaran:', err);
    }
  };

  // Auto-delete notifikasi admin setelah diklik (agar tidak menumpuk di lonceng)
  const handleAutoDeleteAdminNotif = async (notifId) => {
    if (typeof notifId !== 'number') return; // Jangan hapus notif dinamis (string id)
    try {
      await api.delete(`/notifications/${notifId}`);
      // Refresh daftar notifikasi di local state
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Gagal auto-delete notif admin:', err);
    }
  };

  // Bersihkan semua notifikasi admin sekaligus
  const handleClearAllAdminNotifs = async () => {
    if (!await confirmDialog('Apakah Anda yakin ingin menghapus semua notifikasi di lonceng ini?')) return;
    try {
      const adminNotifIds = notifications.map(n => n.id).filter(id => typeof id === 'number');
      await Promise.all(adminNotifIds.map(id => api.delete(`/notifications/${id}`).catch(() => {})));
      setNotifications([]);
      setUnreadCount(0);
      alertDialog('Semua notifikasi berhasil dibersihkan!', 'Berhasil');
    } catch (err) {
      console.error('Gagal membersihkan notifikasi:', err);
    }
  };

  // Buka modal / navigasi saat notifikasi lonceng diklik
  const handleOpenNotifDetail = async (notif) => {
    setIsNotifOpen(false); // Tutup dropdown lonceng dulu

    if (user.role === 'ADMIN') {
      // Tandai notifikasi sebagai dibaca oleh admin (tidak langsung dihapus)
      handleMarkAdminNotifRead(notif.id);

      const judul = notif.judul ? notif.judul.toLowerCase() : '';
      
      // 1. Notifikasi Pendaftaran Akun Baru ➔ Langsung ke Halaman Persetujuan Akun
      if (judul.includes('pendaftaran akun') || judul.includes('pendaftaran baru')) {
        navigate('/persetujuan-akun');
        return;
      }

      // 2. Notifikasi Perubahan Profil Santri ➔ Langsung ke Halaman Detail Profil Santri yang bersangkutan
      if (judul.includes('perubahan profil') || judul.includes('profil santri')) {
        // Coba ekstrak ID dari isi notif format: "ID: 123" atau "(ID: 123)"
        const idMatch = notif.isi ? notif.isi.match(/ID:\s*(\d+)/i) : null;
        if (idMatch && idMatch[1]) {
          navigate(`/profil/${idMatch[1]}`);
          return;
        }

        // Ekstrak nama santri dari judul "Perubahan Profil Santri: [Nama]"
        const rawName = notif.judul ? notif.judul.replace(/^perubahan profil santri:\s*/i, '').trim() : '';
        const cleanName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Coba cari dari daftar allSantri yang sudah di-fetch
        if (allSantri && allSantri.length > 0 && cleanName) {
          const found = allSantri.find(s => {
            const sClean = (s.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return sClean === cleanName || sClean.includes(cleanName) || cleanName.includes(sClean);
          });
          if (found) {
            navigate(`/profil/${found.id}`);
            return;
          }
        }

        // Jika belum ada di memory, fetch langsung data santri terbaru dari server
        try {
          const freshSantriList = await api.get('/admin/santri');
          if (Array.isArray(freshSantriList) && cleanName) {
            const match = freshSantriList.find(s => {
              const sClean = (s.nama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              return sClean === cleanName || sClean.includes(cleanName) || cleanName.includes(sClean);
            });
            if (match) {
              navigate(`/profil/${match.id}`);
              return;
            }
          }
        } catch (fetchErr) {
          console.warn('Gagal mencari detail profil santri:', fetchErr);
        }

        // Fallback jika ID santri tetap tidak ditemukan: Buka modal detail notifikasi (jangan ke dashboard)
        setSelectedNotif(notif);
        return;
      }

      // 3. Notifikasi yang bersifat pengumuman / global ➔ Buka modal detail notifikasi
      setSelectedNotif(notif);
      return;
    }

    // Untuk SANTRI: Buka modal detail pengumuman
    setSelectedNotif(notif);
    if (user.role === 'SANTRI') {
      handleMarkSingleRead(notif.id);
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
    } else if (path === '/persetujuan-akun') {
      crumbs.push({ label: 'Persetujuan Akun Baru', path: '/persetujuan-akun' });
    }

    return crumbs;
  };

  const navItems = [
    { label: 'Beranda', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Pendidikan', path: '/pendidikan', icon: BookOpen, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Kelas / Rombel', path: '/kelas', icon: Users, roles: ['ADMIN'] },
    { label: 'Persetujuan Akun', path: '/persetujuan-akun', icon: UserCheck, roles: ['ADMIN'], badge: pendingRegCount },
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
    <div className="bg-[#F5F5F0] flex flex-col md:flex-row md:h-screen md:overflow-hidden text-[#1A1A1A]">
      {/* SIDEBAR - DESKTOP */}
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#0F3D2E] via-[#0B2E22] to-[#082018] text-white shadow-2xl flex-shrink-0 no-print relative md:h-screen">
        {/* Subtle accent border line at the right edge */}
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#D4AF37]/45 via-[#E8C766]/15 to-transparent"></div>

        {/* Brand Header */}
        <div className="p-6 pb-6 flex items-center space-x-3 relative">
          <div className="p-1.5 bg-[#0B4A3F] border border-[#D4AF37]/50 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.2)] relative group flex-shrink-0">
            <img src="/logo.png" className="w-9 h-9 object-contain drop-shadow" alt="Logo Pesantren" />
            <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition duration-300"></div>
          </div>
          <div>
            <h1 className="font-extrabold text-base font-serif tracking-wide text-white leading-tight">
              Miftahul Huda
            </h1>
            <p className="text-[10px] text-[#E8C766] font-bold tracking-wider uppercase">As-Syadzili • SIM</p>
          </div>
          {/* Elegant Gold Gradient Divider */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent"></div>
        </div>

        {/* User Profile Summary Card */}
        <div className="p-4 relative">
          <Link 
            to="/profil"
            className="flex items-center space-x-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-[#D4AF37]/30 transition-all duration-300 group block cursor-pointer shadow-md"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#0B4A3F] flex items-center justify-center font-bold text-white uppercase text-base border-2 border-[#D4AF37]/75 shadow-lg overflow-hidden relative">
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
            </div>
            <div className="overflow-hidden flex-1">
              <h2 className="font-bold text-xs text-white truncate font-sans group-hover:text-[#E8C766] transition-colors duration-250 leading-tight">{user?.nama}</h2>
              <span className="inline-flex items-center space-x-1 text-[8px] font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-[#D4AF37]/30 to-[#E8C766]/15 text-[#E8C766] border border-[#D4AF37]/45 shadow-sm uppercase mt-1">
                <Sparkles size={8} className="text-[#E8C766] animate-pulse" />
                <span>{user?.role === 'ADMIN' ? 'Server / Admin' : `Santri ${user?.kelas || ''}`}</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links Grouped */}
        <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
          {/* Group 1: Menu Utama */}
          <div className="space-y-1">
            <span className="px-3 text-[9px] font-extrabold text-[#8A8F98] tracking-widest uppercase block mb-2 opacity-60">MENU UTAMA</span>
            {filteredNavItems.filter(item => ['Beranda', 'Profil'].includes(item.label)).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#E8C766] border-l-4 border-[#D4AF37] translate-x-1 shadow-md'
                      : 'text-emerald-100/75 hover:bg-white/[0.05] hover:text-[#E8C766] hover:translate-x-1'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#E8C766]' : 'text-emerald-200/80 group-hover:text-[#E8C766] transition-colors duration-200'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Group 2: Layanan & Data */}
          {filteredNavItems.filter(item => !['Beranda', 'Profil'].includes(item.label)).length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="px-3 text-[9px] font-extrabold text-[#8A8F98] tracking-widest uppercase block mb-2 opacity-60">AKADEMIK & DATA</span>
              {filteredNavItems.filter(item => !['Beranda', 'Profil'].includes(item.label)).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#E8C766] border-l-4 border-[#D4AF37] translate-x-1 shadow-md'
                        : 'text-emerald-100/75 hover:bg-white/[0.05] hover:text-[#E8C766] hover:translate-x-1'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#E8C766]' : 'text-emerald-200/80 group-hover:text-[#E8C766] transition-colors duration-200'} />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-auto bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tombol Tambah Santri Baru (CTA Khusus) */}
          {user?.role === 'ADMIN' && (
            <div className="pt-3 border-t border-white/[0.08]">
              <Link
                to="/tambah-santri"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 transform active:scale-95 shadow-md ${
                  isTambahSantriActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] text-[#083831] shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-[#D4AF37]/15 text-[#E8C766] hover:bg-[#D4AF37]/25 hover:text-[#FFF5D1] border border-[#D4AF37]/45'
                }`}
              >
                <UserPlus size={18} className={isTambahSantriActive ? 'text-[#083831]' : 'text-[#E8C766]'} />
                <span>Tambah Santri Baru</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/[0.08] bg-[#082018]/70">
          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-xs font-bold text-rose-300/80 hover:text-white hover:bg-rose-600/20 rounded-xl transition-all duration-200 border border-rose-500/15 hover:border-rose-500/35 active:scale-95 shadow-sm"
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
                {user.role === 'ADMIN' ? (
                  notifications.length > 0 && (
                    <button 
                      onClick={handleClearAllAdminNotifs} 
                      className="text-[9px] text-rose-200 hover:text-white font-medium underline flex items-center space-x-1"
                    >
                      <Trash2 size={10} />
                      <span>Bersihkan Semua</span>
                    </button>
                  )
                ) : (
                  unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-[9px] text-emerald-250 hover:text-white font-medium underline"
                    >
                      Semua Dibaca
                    </button>
                  )
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
                        className={`p-3 cursor-pointer hover:bg-emerald-50/60 transition-colors duration-150 relative group ${!isRead ? 'bg-emerald-50/40 font-medium' : ''}`}
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
                            {user.role === 'ADMIN' && typeof n.id === 'number' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(n.id);
                                }}
                                title="Hapus Notifikasi"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition ml-0.5"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mt-1 leading-tight text-[10px]">{n.judul}</h4>
                        <p className="text-slate-500 mt-0.5 text-[9px] leading-relaxed line-clamp-2">{n.isi}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[8px] text-emerald-600 font-bold">
                            {user.role === 'ADMIN'
                              ? (n.judul && n.judul.toLowerCase().includes('pendaftaran')
                                  ? 'Tap untuk buka persetujuan akun →'
                                  : n.judul && n.judul.toLowerCase().includes('perubahan profil')
                                  ? 'Tap untuk buka profil santri →'
                                  : 'Tap untuk kelola pemberitahuan →')
                              : 'Tap untuk baca selengkapnya →'}
                          </p>
                          {user.role === 'ADMIN' && typeof n.id === 'number' && (
                            <span
                              className="text-[8px] text-rose-500 font-semibold hover:underline flex items-center gap-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(n.id);
                              }}
                            >
                              <Trash2 size={9} /> Hapus
                            </span>
                          )}
                        </div>
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
          <aside className="relative flex flex-col w-64 bg-gradient-to-b from-[#0F3D2E] via-[#0B2E22] to-[#082018] text-white shadow-2xl z-10 animate-slide-in border-r border-[#D4AF37]/30">
            <div 
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
              className="p-4 border-b border-white/[0.08] bg-[#082018]/90 flex items-center justify-between"
            >
              <span className="font-bold text-xs font-serif text-[#E8C766] uppercase tracking-wider">Menu Navigasi</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-emerald-250 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {/* User Profile Summary Card Mobile */}
            <div className="p-4">
              <Link 
                to="/profil"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] block cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#0B4A3F] flex items-center justify-center font-bold text-white uppercase text-base border border-[#D4AF37] overflow-hidden relative">
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
                </div>
                <div className="overflow-hidden flex-1">
                  <h2 className="font-bold text-xs text-white truncate font-sans">{user?.nama}</h2>
                  <span className="inline-flex items-center space-x-1 text-[8px] font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-[#D4AF37]/30 to-[#E8C766]/15 text-[#E8C766] border border-[#D4AF37]/45 uppercase mt-0.5">
                    {user?.role === 'ADMIN' ? 'Server / Admin' : `Santri ${user?.kelas || ''}`}
                  </span>
                </div>
              </Link>
            </div>
 
            {/* Mobile Navigation Links Grouped */}
            <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
              {/* Group 1: Menu Utama */}
              <div className="space-y-1">
                <span className="px-3 text-[9px] font-extrabold text-[#8A8F98] tracking-widest uppercase block mb-1.5 opacity-60">MENU UTAMA</span>
                {filteredNavItems.filter(item => ['Beranda', 'Profil'].includes(item.label)).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#E8C766] border-l-4 border-[#D4AF37]'
                          : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-[#E8C766]' : 'text-emerald-200/80'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Group 2: Layanan & Data */}
              {filteredNavItems.filter(item => !['Beranda', 'Profil'].includes(item.label)).length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="px-3 text-[9px] font-extrabold text-[#8A8F98] tracking-widest uppercase block mb-1.5 opacity-60">AKADEMIK & DATA</span>
                  {filteredNavItems.filter(item => !['Beranda', 'Profil'].includes(item.label)).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#E8C766] border-l-4 border-[#D4AF37]'
                            : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-[#E8C766]' : 'text-emerald-200/80'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Tombol Tambah Santri Mobile */}
              {user?.role === 'ADMIN' && (
                <div className="pt-3 border-t border-white/[0.08]">
                  <Link
                    to="/tambah-santri"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      isTambahSantriActive
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] text-[#083831] shadow-lg shadow-[#D4AF37]/20'
                        : 'bg-[#D4AF37]/15 text-[#E8C766] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/45'
                    }`}
                  >
                    <UserPlus size={18} className={isTambahSantriActive ? 'text-[#083831]' : 'text-[#E8C766]'} />
                    <span>Tambah Santri Baru</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Logout Mobile */}
            <div className="p-4 border-t border-white/[0.08] bg-[#082018]/70">
              <button
                onClick={() => { setIsSidebarOpen(false); handleLogoutClick(); }}
                className="flex items-center space-x-3 w-full px-4 py-2.5 text-xs font-bold text-rose-300/80 hover:text-white hover:bg-rose-600/20 rounded-xl transition border border-rose-500/15"
              >
                <LogOut size={16} />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
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
                    {user.role === 'ADMIN' ? (
                      notifications.length > 0 && (
                        <button 
                          onClick={handleClearAllAdminNotifs} 
                          className="text-[10px] text-rose-200 hover:text-white font-sans font-bold hover:underline transition duration-150 flex items-center space-x-1"
                        >
                          <Trash2 size={11} />
                          <span>Bersihkan Semua</span>
                        </button>
                      )
                    ) : (
                      unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead} 
                          className="text-[10px] text-emerald-250 hover:text-white font-sans font-semibold underline transition duration-150"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )
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
                            className={`p-3.5 cursor-pointer hover:bg-emerald-50/60 transition-colors duration-150 relative group ${!isRead ? 'bg-emerald-50/40 font-medium' : ''}`}
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
                                {user.role === 'ADMIN' && typeof n.id === 'number' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(n.id);
                                    }}
                                    title="Hapus Notifikasi"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition opacity-60 group-hover:opacity-100"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <h4 className="font-bold text-slate-800 mt-1 text-[11px] leading-tight">{n.judul}</h4>
                            <p className="text-slate-500 mt-1 text-[10px] leading-relaxed line-clamp-2">{n.isi}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[9px] text-emerald-600 font-bold">
                                {user.role === 'ADMIN'
                                  ? (n.judul && n.judul.toLowerCase().includes('pendaftaran')
                                      ? 'Klik untuk buka persetujuan akun →'
                                      : n.judul && n.judul.toLowerCase().includes('perubahan profil')
                                      ? 'Klik untuk buka profil santri →'
                                      : 'Klik untuk kelola pemberitahuan →')
                                  : 'Klik untuk baca selengkapnya →'}
                              </p>
                              {user.role === 'ADMIN' && typeof n.id === 'number' && (
                                <span
                                  className="text-[9px] text-rose-500 font-semibold hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(n.id);
                                  }}
                                >
                                  <Trash2 size={10} /> Hapus
                                </span>
                              )}
                            </div>
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

