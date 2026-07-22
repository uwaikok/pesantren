import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Bell,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';

function Layout({ children, user, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingUsersList, setPendingUsersList] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchPending = async () => {
        try {
          const res = await api.get('/admin/users/pending');
          setPendingUsersList(res);
          setPendingUsers(res.length);
        } catch (e) {}
      };
      fetchPending();
    }
  }, [user]);

  const handleAccept = async (id) => {
    try {
      await api.put(`/admin/users/${id}/verify`);
      setPendingUsersList(prev => prev.filter(u => u.id !== id));
      setPendingUsers(prev => prev - 1);
      window.dispatchEvent(new Event('refreshData')); // for Dashboard
    } catch (e) {
      alert('Gagal menyetujui');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/admin/santri/${id}`);
      setPendingUsersList(prev => prev.filter(u => u.id !== id));
      setPendingUsers(prev => prev - 1);
      window.dispatchEvent(new Event('refreshData')); // for Dashboard
    } catch (e) {
      alert('Gagal menolak');
    }
  };

  // Memetakan rute ke label breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ label: 'Beranda', path: '/' }];

    if (path === '/pendidikan') {
      crumbs.push({ label: 'Modul Akademik & Pendidikan', path: '/pendidikan' });
    } else if (path === '/keamanan') {
      crumbs.push({ label: 'Modul Keamanan & Sanksi', path: '/keamanan' });
    } else if (path === '/keuangan') {
      crumbs.push({ label: 'Modul Bendahara & Syariah', path: '/keuangan' });
    } else if (path.startsWith('/profil')) {
      crumbs.push({ label: 'Profil Akun', path: '/profil' });
    } else if (path === '/buat-akun') {
      crumbs.push({ label: 'Buat Akun Santri', path: '/buat-akun' });
    }

    return crumbs;
  };

  const navItems = [
    { label: 'Beranda', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Pendidikan', path: '/pendidikan', icon: BookOpen, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Keamanan', path: '/keamanan', icon: ShieldAlert, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Bendahara', path: '/keuangan', icon: DollarSign, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Profil', path: '/profil', icon: User, roles: ['ADMIN', 'SANTRI'] },
    { label: 'Buat Akun', path: '/buat-akun', icon: UserPlus, roles: ['ADMIN'] },
  ];

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

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
      <header className="md:hidden bg-[#0B4A3F] text-white p-3.5 flex items-center justify-between shadow-md no-print z-30 sticky top-0 border-b border-[#D4AF37]/30">
        <div className="flex items-center space-x-2.5">
          <img src="/logo.png" className="w-7 h-7 object-contain drop-shadow" alt="Logo" />
          <div>
            <span className="font-bold text-xs tracking-wide text-white font-serif block leading-tight">SIM Pesantren</span>
            <span className="text-[9px] text-[#E8C766] font-semibold">Miftahul Huda As-Syadzili</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowNotif(!showNotif)} 
              className="relative p-2 text-emerald-100 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Notifikasi Pending"
            >
              <Bell size={18} />
              {pendingUsers > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[#0B4A3F] animate-pulse">
                  {pendingUsers}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
            <div className="p-4 border-b border-white/10 bg-[#083831] flex items-center justify-between">
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
                    {user?.role}
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
      <div className="flex-1 flex flex-col min-w-0" onClick={() => showNotif && setShowNotif(false)}>
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
            {user?.role === 'ADMIN' && (
              <button onClick={() => setShowNotif(!showNotif)} className="relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition text-slate-600 hover:text-[#0B4A3F]" title="Notifikasi Pending">
                <Bell size={18} />
                {pendingUsers > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
                    {pendingUsers}
                  </span>
                )}
              </button>
            )}
            
            {/* NOTIFICATION POPUP MODAL */}
            {showNotif && user?.role === 'ADMIN' && (
              <div className="fixed top-14 right-3 md:top-16 md:right-8 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in zoom-in duration-150">
                <div className="bg-[#0B4A3F] text-white p-3.5 font-bold text-xs flex justify-between items-center border-b border-[#D4AF37]/30">
                  <span className="flex items-center space-x-1.5 font-serif">
                    <Bell size={14} className="text-[#E8C766]" />
                    <span>Persetujuan Santri Baru</span>
                  </span>
                  <span className="bg-[#D4AF37] text-[#0B4A3F] font-extrabold px-2 py-0.5 rounded-full text-[10px]">{pendingUsers} Pending</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {pendingUsers === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Alhamdulillah, tidak ada pendaftaran tertunda.</div>
                  ) : (
                    pendingUsersList.map(p => (
                      <div key={p.id} className="p-3.5 hover:bg-slate-50 transition text-xs">
                        <div className="font-bold text-[#0B4A3F]">{p.nama}</div>
                        <div className="text-[10px] text-slate-500 mb-2.5 mt-0.5">{p.email} • {p.noHp}</div>
                        <div className="flex space-x-2">
                          <button onClick={() => handleAccept(p.id)} className="flex-1 bg-[#0B4A3F] hover:bg-[#083831] text-white text-[10px] font-bold py-1.5 rounded-lg transition shadow-sm">Terima</button>
                          <button onClick={() => handleReject(p.id)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition shadow-sm">Tolak</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium border-l border-slate-200 pl-5">
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
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;

