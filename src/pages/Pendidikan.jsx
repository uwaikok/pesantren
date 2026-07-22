import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Printer, Calendar, GraduationCap } from 'lucide-react';
import api from '../utils/api';

function Pendidikan({ user }) {
  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [currentSantriDetails, setCurrentSantriDetails] = useState(null);
  
  const [nilaiList, setNilaiList] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
  const [semester, setSemester] = useState('GANJIL');
  const [loading, setLoading] = useState(false);
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD or EDIT
  const [editingNilaiId, setEditingNilaiId] = useState(null);
  const [formNilai, setFormNilai] = useState({
    mataPelajaran: '',
    nilaiUts: '',
    nilaiUas: '',
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
      fetchNilaiData();
    }
  }, [selectedSantriId, tahunAjaran, semester]);

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

  const fetchNilaiData = async () => {
    setLoading(true);
    try {
      // Dapatkan data nilai
      const url = user.role === 'ADMIN' 
        ? `/akademik/santri/${selectedSantriId}`
        : '/akademik/my';
        
      const response = await api.get(url, {
        params: { tahunAjaran, semester }
      });
      setNilaiList(response);

      // Cari nama santri terpilih untuk cetak rapor
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
    setFormNilai({
      mataPelajaran: '',
      nilaiUts: '',
      nilaiUas: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n) => {
    setModalMode('EDIT');
    setEditingNilaiId(n.id);
    setFormNilai({
      mataPelajaran: n.mataPelajaran,
      nilaiUts: n.nilaiUts.toString(),
      nilaiUas: n.nilaiUas.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSubmitNilai = async (e) => {
    e.preventDefault();
    const { mataPelajaran, nilaiUts, nilaiUas } = formNilai;

    if (!mataPelajaran || nilaiUts === '' || nilaiUas === '') {
      alert('Semua field nilai wajib diisi');
      return;
    }

    const payload = {
      santriId: parseInt(selectedSantriId),
      mataPelajaran,
      nilaiUts: parseFloat(nilaiUts),
      nilaiUas: parseFloat(nilaiUas),
      semester,
      tahunAjaran
    };

    try {
      if (modalMode === 'ADD') {
        await api.post('/akademik', payload);
      } else {
        await api.put(`/akademik/${editingNilaiId}`, payload);
      }
      setIsModalOpen(false);
      fetchNilaiData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan nilai');
    }
  };

  const handleDeleteNilai = async (id) => {
    if (!window.confirm('Hapus entri nilai ini?')) return;
    try {
      await api.delete(`/akademik/${id}`);
      fetchNilaiData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus nilai');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Hitung Nilai Rata-rata & Huruf
  const getAverage = (uts, uas) => ((uts + uas) / 2).toFixed(1);

  const getHuruf = (score) => {
    const s = parseFloat(score);
    if (s >= 85) return 'A';
    if (s >= 75) return 'B';
    if (s >= 65) return 'C';
    if (s >= 50) return 'D';
    return 'E';
  };

  const getKeterangan = (huruf) => {
    if (huruf === 'A') return 'Sangat Baik (Mumtaz)';
    if (huruf === 'B') return 'Baik (Jayyid)';
    if (huruf === 'C') return 'Cukup (Maqbul)';
    if (huruf === 'D') return 'Kurang';
    return 'Kurang Sekali';
  };

  const totalNilai = nilaiList.reduce((acc, curr) => acc + (curr.nilaiUts + curr.nilaiUas) / 2, 0);
  const rataRataRapor = nilaiList.length > 0 ? (totalNilai / nilaiList.length).toFixed(1) : '-';

  return (
    <div className="space-y-6">
      {/* TOOLBAR UTAMA (no-print) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
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

          {/* Tahun Ajaran */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun Ajaran</label>
            <select
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>

          {/* Semester */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="GANJIL">GANJIL (Ganjil)</option>
              <option value="GENAP">GENAP (Genap)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          {user.role === 'ADMIN' && (
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/10 flex items-center space-x-1.5 transition"
            >
              <Plus size={16} />
              <span>Input Nilai Baru</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
          >
            <Printer size={16} />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </div>

      {/* VIEW DI DASHBOARD / WEBSITE (no-print) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
        <h2 className="text-base font-bold text-slate-800 font-serif mb-4 flex items-center space-x-2">
          <BookOpen className="text-emerald-600" size={20} />
          <span>Hasil Studi Akademik - {currentSantriDetails?.nama}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mata Pelajaran</th>
                  <th className="py-3 px-4 text-center">Nilai UTS</th>
                  <th className="py-3 px-4 text-center">Nilai UAS</th>
                  <th className="py-3 px-4 text-center">Rata-Rata</th>
                  <th className="py-3 px-4 text-center">Nilai Huruf</th>
                  <th className="py-3 px-4">Predikat / Keterangan</th>
                  {user.role === 'ADMIN' && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nilaiList.length > 0 ? (
                  nilaiList.map((n) => {
                    const avg = getAverage(n.nilaiUts, n.nilaiUas);
                    const huruf = getHuruf(avg);
                    return (
                      <tr key={n.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">{n.mataPelajaran}</td>
                        <td className="py-3 px-4 text-center font-medium">{n.nilaiUts}</td>
                        <td className="py-3 px-4 text-center font-medium">{n.nilaiUas}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-800">{avg}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block w-6 py-0.5 rounded font-bold text-center ${
                            huruf === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            huruf === 'B' ? 'bg-sky-100 text-sky-800' :
                            huruf === 'C' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {huruf}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{getKeterangan(huruf)}</td>
                        {user.role === 'ADMIN' && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-1.5">
                              <button
                                onClick={() => handleOpenEdit(n)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteNilai(n.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={user.role === 'ADMIN' ? '7' : '6'} className="py-8 text-center text-slate-400">
                      Belum ada entri nilai untuk tahun ajaran {tahunAjaran} Semester {semester}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ELEMEN RAPOR CETAK PRINT-FRIENDLY (TAMPIL HANYA SAAT PRINT) */}
      <div className="hidden print:block print-area bg-white p-8 font-serif leading-relaxed text-sm">
        {/* KOP Surat Pesantren */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider">YAYASAN MIFTAHUL HUDA AS-SYADZILI</h1>
          <h2 className="text-2xl font-extrabold uppercase font-serif text-emerald-950 mt-1">PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI</h2>
          <p className="text-[10px] text-slate-500 font-sans mt-1">
            Jl. Raya Pesantren No. 1, Sumberpasir, Pakis, Malang • Telp: (0341) 789012 • Web: miftahulhuda-assyadzili.or.id
          </p>
        </div>

        <h3 className="text-center text-base font-bold underline uppercase tracking-wider mb-6">
          LAPORAN HASIL EVALUASI BELAJAR SANTRI (RAPOR)
        </h3>

        {/* Informasi Santri Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-6 border border-slate-200 p-4 bg-slate-50 rounded-lg">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-32 font-bold text-slate-500 py-1">Nama Santri</td>
                  <td className="w-4 py-1">:</td>
                  <td className="font-bold py-1 text-slate-800">{currentSantriDetails?.nama}</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-500 py-1">Kelas / Kamar</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{currentSantriDetails?.kelas || 'Belum Ditentukan'}</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-500 py-1">Nomor Induk (ID)</td>
                  <td className="py-1">:</td>
                  <td className="py-1">PP-{selectedSantriId.toString().padStart(4, '0')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="w-32 font-bold text-slate-500 py-1">Tahun Ajaran</td>
                  <td className="w-4 py-1">:</td>
                  <td className="py-1 font-bold">{tahunAjaran}</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-500 py-1">Semester</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-bold">{semester}</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-500 py-1">Tanggal Cetak</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Nilai Rapor */}
        <table className="w-full border-collapse border border-slate-900 text-xs mb-8">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-900 py-2.5 px-3 text-center w-8">No</th>
              <th className="border border-slate-900 py-2.5 px-3 text-left">Mata Pelajaran Pesantren</th>
              <th className="border border-slate-900 py-2.5 px-3 text-center w-20">Nilai UTS</th>
              <th className="border border-slate-900 py-2.5 px-3 text-center w-20">Nilai UAS</th>
              <th className="border border-slate-900 py-2.5 px-3 text-center w-24">Rata-Rata Angka</th>
              <th className="border border-slate-900 py-2.5 px-3 text-center w-20">Nilai Huruf</th>
              <th className="border border-slate-900 py-2.5 px-3 text-left w-48">Kriteria Ketuntasan</th>
            </tr>
          </thead>
          <tbody>
            {nilaiList.length > 0 ? (
              nilaiList.map((n, i) => {
                const avg = getAverage(n.nilaiUts, n.nilaiUas);
                const huruf = getHuruf(avg);
                return (
                  <tr key={n.id}>
                    <td className="border border-slate-900 py-2 px-3 text-center">{i + 1}</td>
                    <td className="border border-slate-900 py-2 px-3 font-semibold">{n.mataPelajaran}</td>
                    <td className="border border-slate-900 py-2 px-3 text-center">{n.nilaiUts}</td>
                    <td className="border border-slate-900 py-2 px-3 text-center">{n.nilaiUas}</td>
                    <td className="border border-slate-900 py-2 px-3 text-center font-bold">{avg}</td>
                    <td className="border border-slate-900 py-2 px-3 text-center font-bold">{huruf}</td>
                    <td className="border border-slate-900 py-2 px-3">{getKeterangan(huruf)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="border border-slate-900 py-6 text-center text-slate-400">
                  Tidak ada data nilai rapor untuk semester ini.
                </td>
              </tr>
            )}
            <tr className="bg-slate-100 font-bold">
              <td colSpan="4" className="border border-slate-900 py-2 px-3 text-right">Nilai Rata-Rata Akumulasi</td>
              <td className="border border-slate-900 py-2 px-3 text-center text-emerald-800 text-sm">{rataRataRapor}</td>
              <td colSpan="2" className="border border-slate-900 py-2 px-3 text-left uppercase text-[10px]">
                {rataRataRapor !== '-' ? `Predikat: ${getKeterangan(getHuruf(rataRataRapor))}` : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tanda Tangan Cetak */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs mt-12">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Orang Tua / Wali Santri</p>
            <div className="h-16"></div>
            <p className="underline font-bold">______________________</p>
            <p className="text-[10px] text-slate-500">Nama Lengkap & Ttd</p>
          </div>
          <div>
            <p>Ditetapkan di Malang,</p>
            <p className="font-bold">Wali Kelas / Kamar</p>
            <div className="h-16"></div>
            <p className="underline font-bold">{user.role === 'ADMIN' ? user.nama : 'Ustadz Pembina Kelas'}</p>
            <p className="text-[10px] text-slate-500">NIP. PP-{selectedSantriId}</p>
          </div>
          <div>
            <p>Mengesahkan,</p>
            <p className="font-bold">Kepala Pengasuh Pesantren</p>
            <div className="h-16"></div>
            <p className="underline font-bold">RIFKI AHMAD DZULFIKRI</p>
            <p className="text-[10px] text-slate-500">Pimpinan Yayasan Miftahul Huda As-Syadzili</p>
          </div>
        </div>
      </div>

      {/* MODAL INPUT / EDIT NILAI (no-print) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 bg-emerald-950 text-white font-serif font-bold text-base flex justify-between items-center">
              <span>{modalMode === 'ADD' ? 'Input Nilai Akademik Baru' : 'Edit Nilai Akademik'}</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmitNilai} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formNilai.mataPelajaran}
                  onChange={(e) => setFormNilai({ ...formNilai, mataPelajaran: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Nilai UTS */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nilai UTS</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formNilai.nilaiUts}
                    onChange={(e) => setFormNilai({ ...formNilai, nilaiUts: e.target.value })}
                    placeholder="0 - 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                
                {/* Nilai UAS */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nilai UAS</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formNilai.nilaiUas}
                    onChange={(e) => setFormNilai({ ...formNilai, nilaiUas: e.target.value })}
                    placeholder="0 - 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-2 text-[10px] text-slate-500">
                <Calendar size={14} className="text-slate-400" />
                <span>Nilai akan tersimpan pada <strong>Semester {semester}</strong> Tahun Ajaran <strong>{tahunAjaran}</strong>.</span>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-md"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pendidikan;
