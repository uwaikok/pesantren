import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Edit, Trash2, Calendar, Search, Filter } from 'lucide-react';
import api from '../utils/api';

function Keamanan({ user }) {
  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [currentSantriDetails, setCurrentSantriDetails] = useState(null);
  
  const [sanksiList, setSanksiList] = useState([]);
  const [filterKategori, setFilterKategori] = useState('');
  const [filterTahun, setFilterTahun] = useState('2025/2026');
  const [loading, setLoading] = useState(false);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD or EDIT
  const [editingSanksiId, setEditingSanksiId] = useState(null);
  const [formSanksi, setFormSanksi] = useState({
    tanggalPelanggaran: new Date().toISOString().split('T')[0],
    tahun: '2025/2026',
    deskripsi: '',
    kategori: 'RINGAN',
  });

  useEffect(() => {
    if (user.role === 'ADMIN') {
      fetchSantriList();
    } else {
      setSelectedSantriId(user.id);
      setCurrentSantriDetails(user);
    }
  }, [user]);

  useEffect(() => {
    if (selectedSantriId) {
      fetchSanksiData();
    }
  }, [selectedSantriId, filterKategori, filterTahun]);

  const fetchSantriList = async () => {
    try {
      const list = await api.get('/admin/santri');
      const activeSantri = list.filter(s => s.status === 'ACTIVE');
      setSantriList(activeSantri);
      if (activeSantri.length > 0) {
        setSelectedSantriId(activeSantri[0].id);
        setCurrentSantriDetails(activeSantri[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSanksiData = async () => {
    setLoading(true);
    try {
      const url = user.role === 'ADMIN'
        ? `/keamanan/santri/${selectedSantriId}`
        : '/keamanan/my';

      const response = await api.get(url, {
        params: { kategori: filterKategori, tahun: filterTahun }
      });
      setSanksiList(response);

      if (user.role === 'ADMIN' && santriList.length > 0) {
        const found = santriList.find(s => s.id === parseInt(selectedSantriId));
        setCurrentSantriDetails(found || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setFormSanksi({
      tanggalPelanggaran: new Date().toISOString().split('T')[0],
      tahun: filterTahun || '2025/2026',
      deskripsi: '',
      kategori: 'RINGAN',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setModalMode('EDIT');
    setEditingSanksiId(s.id);
    setFormSanksi({
      tanggalPelanggaran: s.tanggalPelanggaran.split('T')[0],
      tahun: s.tahun,
      deskripsi: s.deskripsi,
      kategori: s.kategori,
    });
    setIsModalOpen(true);
  };

  const handleSubmitSanksi = async (e) => {
    e.preventDefault();
    const { tanggalPelanggaran, tahun, deskripsi, kategori } = formSanksi;

    if (!tanggalPelanggaran || !tahun || !deskripsi || !kategori) {
      alert('Semua field pelanggaran wajib diisi');
      return;
    }

    const payload = {
      santriId: parseInt(selectedSantriId),
      tanggalPelanggaran,
      tahun,
      deskripsi,
      kategori
    };

    try {
      if (modalMode === 'ADD') {
        await api.post('/keamanan', payload);
      } else {
        await api.put(`/keamanan/${editingSanksiId}`, payload);
      }
      setIsModalOpen(false);
      fetchSanksiData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan catatan pelanggaran');
    }
  };

  const handleDeleteSanksi = async (id) => {
    if (!window.confirm('Hapus catatan pelanggaran ini?')) return;
    try {
      await api.delete(`/keamanan/${id}`);
      fetchSanksiData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus catatan');
    }
  };

  const getKategoriBadge = (kategori) => {
    if (kategori === 'RINGAN') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (kategori === 'SEDANG') {
      return 'bg-orange-100 text-orange-850 border-orange-200';
    }
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR UTAMA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown Pilihan Santri (Admin Only) */}
          {user.role === 'ADMIN' && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pilih Santri</label>
              <select
                value={selectedSantriId}
                onChange={(e) => setSelectedSantriId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Kategori */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori Sanksi</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="">Semua Tingkat</option>
              <option value="RINGAN">RINGAN</option>
              <option value="SEDANG">SEDANG</option>
              <option value="BERAT">BERAT</option>
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun Kejadian</label>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <button
            onClick={handleOpenAdd}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-rose-600/10 flex items-center space-x-1.5 transition self-start md:self-center"
          >
            <Plus size={16} />
            <span>Catat Pelanggaran</span>
          </button>
        )}
      </div>

      {/* VIEW RIWAYAT PELANGGARAN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 font-serif mb-4 flex items-center space-x-2">
          <ShieldAlert className="text-rose-600" size={20} />
          <span>Buku Catatan Kedisiplinan - {currentSantriDetails?.nama}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-32">Tanggal Kejadian</th>
                  <th className="py-3 px-4 w-28">Tahun Ajaran</th>
                  <th className="py-3 px-4 w-28 text-center">Tingkat Sanksi</th>
                  <th className="py-3 px-4">Deskripsi Tindakan Pelanggaran</th>
                  {user.role === 'ADMIN' && <th className="py-3 px-4 text-center w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sanksiList.length > 0 ? (
                  sanksiList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {new Date(s.tanggalPelanggaran).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{s.tahun}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getKategoriBadge(s.kategori)}`}>
                          {s.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-md">{s.deskripsi}</td>
                      {user.role === 'ADMIN' && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteSanksi(s.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={user.role === 'ADMIN' ? '5' : '4'} className="py-8 text-center text-slate-400">
                      Alhamdulillah, tidak ada catatan pelanggaran disiplin untuk tahun ajaran {filterTahun}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL INPUT / EDIT SANKSI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 bg-rose-950 text-white font-serif font-bold text-base flex justify-between items-center">
              <span>{modalMode === 'ADD' ? 'Catat Pelanggaran Disiplin Baru' : 'Edit Catatan Pelanggaran'}</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmitSanksi} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal Pelanggaran */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tanggal Pelanggaran</label>
                  <input
                    type="date"
                    required
                    value={formSanksi.tanggalPelanggaran}
                    onChange={(e) => setFormSanksi({ ...formSanksi, tanggalPelanggaran: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Tahun Ajaran / Kejadian */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tahun Kejadian</label>
                  <select
                    value={formSanksi.tahun}
                    onChange={(e) => setFormSanksi({ ...formSanksi, tahun: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
              </div>

              {/* Kategori Sanksi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tingkat Pelanggaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {['RINGAN', 'SEDANG', 'BERAT'].map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFormSanksi({ ...formSanksi, kategori: k })}
                      className={`py-2 rounded-lg font-bold text-[10px] transition border ${
                        formSanksi.kategori === k
                          ? k === 'RINGAN' ? 'bg-amber-500 text-white border-amber-600 shadow' :
                            k === 'SEDANG' ? 'bg-orange-500 text-white border-orange-600 shadow' :
                            'bg-rose-600 text-white border-rose-700 shadow'
                          : 'bg-slate-50 border-slate-250 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan / Deskripsi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Deskripsi / Detail Pelanggaran</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Sebutkan detail tindakan pelanggaran santri..."
                  value={formSanksi.deskripsi}
                  onChange={(e) => setFormSanksi({ ...formSanksi, deskripsi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shadow-md"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Keamanan;
