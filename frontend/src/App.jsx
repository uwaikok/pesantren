import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './utils/api';

// Pages & Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pendidikan from './pages/Pendidikan';
import Keamanan from './pages/Keamanan';
import Keuangan from './pages/Keuangan';
import Profil from './pages/Profil';
import BuatAkun from './pages/BuatAkun';

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
    localStorage.removeItem('simesra_token');
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
      {demoMode && (
        <div className="bg-amber-500 text-white text-center py-1 text-xs font-semibold px-4 flex justify-between items-center no-print">
          <span>⚠️ Server offline. Berjalan dalam <strong>Mode Demo (Local Storage)</strong>. Seluruh data tersimpan di browser Anda.</span>
          <button 
            onClick={() => {
              localStorage.removeItem('use_mock_db');
              window.location.reload();
            }}
            className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[10px] transition"
          >
            Matikan Mode Demo
          </button>
        </div>
      )}
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={checkAuth} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <Register />} 
        />

        {/* Private Routes wrapped in Layout */}
        <Route 
          path="/" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/pendidikan" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Pendidikan user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/keamanan" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Keamanan user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/keuangan" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Keuangan user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profil" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Profil user={user} onUserUpdate={handleUserUpdate} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profil/:id" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Profil user={user} onUserUpdate={handleUserUpdate} /></Layout> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/buat-akun" 
          element={user && user.role === 'ADMIN' ? <Layout user={user} onLogout={handleLogout}><BuatAkun user={user} /></Layout> : <Navigate to="/" replace />} 
        />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
