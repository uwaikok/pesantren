import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './utils/api';

// Pages & Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pendidikan from './pages/Pendidikan';
import Keamanan from './pages/Keamanan';
import Keuangan from './pages/Keuangan';
import Profil from './pages/Profil';
import TambahSantri from './pages/TambahSantri';
import KelasRombel from './pages/KelasRombel';
import KirimPemberitahuan from './pages/KirimPemberitahuan';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
      // Sinkronisasi status mode demo ke state React
      setDemoMode(localStorage.getItem('use_mock_db') === 'true');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('simesra_token');
    setUser(null);
  };

  const handleUserUpdate = (updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-emerald-800 font-semibold animate-pulse">Memuat SIM Pesantren...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={checkAuth} />} 
        />

        {/* Private Routes wrapped in Layout */}
        <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/pendidikan" element={<Pendidikan user={user} />} />
          <Route path="/keamanan" element={<Keamanan user={user} />} />
          <Route path="/keuangan" element={<Keuangan user={user} />} />
          <Route path="/profil" element={<Profil user={user} onUserUpdate={handleUserUpdate} />} />
          <Route path="/profil/:id" element={<Profil user={user} onUserUpdate={handleUserUpdate} />} />
          <Route path="/tambah-santri" element={user && user.role === 'ADMIN' ? <TambahSantri /> : <Navigate to="/" replace />} />
          <Route path="/kelas" element={user && user.role === 'ADMIN' ? <KelasRombel user={user} /> : <Navigate to="/" replace />} />
          <Route path="/kirim-pemberitahuan" element={user && user.role === 'ADMIN' ? <KirimPemberitahuan /> : <Navigate to="/" replace />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
