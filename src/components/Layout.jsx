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
  BookMarked,
  UserPlus,
  Bell
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
      crumbs.push({ label: 'Modul Bendahara & SPP', path: '/keuangan' });
    } else if (path.startsWith('/profil')) {
      crumbs.push({ label: 'Profil Akun', path: '/profil' });
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl flex-shrink-0 no-print">
        <div className="p-5 border-b border-slate-800 bg-emerald-950 flex items-center space-x-3">
          <div className="p-1 bg-emerald-950 border border-[#bf953f]/30 rounded-lg">
            <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider text-emerald-100">SIM Pesantren</h1>
            <p className="text-[10px] text-emerald-400 font-medium">Sistem Informasi Manajemen</p>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white uppercase text-base border-2 border-emerald-500 shadow-md overflow-hidden">
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
              <h2 className="font-bold text-sm text-slate-100 truncate">{user?.nama}</h2>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800 uppercase mt-0.5">
                {user?.role === 'ADMIN' ? 'Server / Admin' : `Santri ${user?.kelas || ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Link */}
        <nav className="flex-1 p-4 space-y-1 bg-slate-900">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 translate-x-1'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded-lg transition-all"
          >
            <LogOut size={18} />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-slate-900 text-white p-3.5 flex items-center justify-between shadow-md no-print z-30 sticky top-0">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" className="w-6 h-6 object-contain" alt="Logo" />
          <span className="font-bold text-sm tracking-wider text-emerald-100 font-serif">SIM Pesantren</span>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowNotif(!showNotif)} 
              className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Notifikasi Pending"
            >
              <Bell size={20} />
              {pendingUsers > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 animate-pulse">
                  {pendingUsers}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR - MOBILE DRAWER */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className="relative flex flex-col w-64 bg-slate-900 text-white shadow-2xl z-10 animate-slide-in">
            <div className="p-4 border-b border-slate-800 bg-emerald-950 flex items-center justify-between">
              <span className="font-bold text-emerald-200">Menu Navigasi</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white uppercase border border-emerald-500 overflow-hidden">
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
                  <h2 className="font-bold text-sm text-slate-100">{user?.nama}</h2>
                  <span className="inline-block text-[9px] font-bold px-2 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800 uppercase mt-0.5">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogoutClick}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 rounded-lg transition"
              >
                <LogOut size={18} />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0" onClick={() => showNotif && setShowNotif(false)}>
        {/* Header Desktop */}
        <header className="hidden md:flex bg-white h-16 border-b border-slate-200 items-center justify-between px-8 no-print shadow-sm">
          <div className="flex items-center text-xs font-bold text-slate-500 space-x-2">
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <ChevronRight size={14} className="text-slate-300" />}
                <Link to={crumb.path} className={`hover:text-emerald-700 transition ${idx === getBreadcrumbs().length - 1 ? 'text-emerald-800' : ''}`}>
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex items-center space-x-5">
            {user?.role === 'ADMIN' && (
              <button onClick={() => setShowNotif(!showNotif)} className="relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition text-slate-500 hover:text-emerald-700" title="Notifikasi">
                <Bell size={18} />
                {pendingUsers > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
                    {pendingUsers}
                  </span>
                )}
              </button>
            )}
            
            {/* NOTIFICATION POPUP MODAL (Mobile & Desktop) */}
            {showNotif && user?.role === 'ADMIN' && (
              <div className="fixed top-14 right-3 md:top-16 md:right-8 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in zoom-in duration-150">
                <div className="bg-slate-900 text-white p-3.5 font-bold text-xs flex justify-between items-center">
                  <span className="flex items-center space-x-1.5 font-serif">
                    <Bell size={14} className="text-emerald-400" />
                    <span>Persetujuan Santri Baru</span>
                  </span>
                  <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">{pendingUsers} Pending</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {pendingUsers === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Alhamdulillah, tidak ada pendaftaran tertunda.</div>
                  ) : (
                    pendingUsersList.map(p => (
                      <div key={p.id} className="p-3.5 hover:bg-slate-50 transition text-xs">
                        <div className="font-bold text-slate-800">{p.nama}</div>
                        <div className="text-[10px] text-slate-500 mb-2.5 mt-0.5">{p.email} • {p.noHp}</div>
                        <div className="flex space-x-2">
                          <button onClick={() => handleAccept(p.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition shadow-sm">Terima</button>
                          <button onClick={() => handleReject(p.id)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold py-1.5 rounded-lg transition shadow-sm">Tolak</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium border-l border-slate-200 pl-5">
              <span>SIM Pesantren - v1.0</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
            </div>
          </div>
        </header>

        {/* BREADCRUMB (Mobile) */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center text-xs text-slate-500 no-print">
          {getBreadcrumbs().map((crumb, index, arr) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <ChevronRight size={10} className="mx-1 text-slate-300" />}
              <span className={index === arr.length - 1 ? 'font-semibold text-emerald-700' : ''}>
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
