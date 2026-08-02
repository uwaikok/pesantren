import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Printer, Calendar, GraduationCap, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { confirmDialog, alertDialog } from '../utils/dialog';

function Pendidikan({ user }) {
  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [currentSantriDetails, setCurrentSantriDetails] = useState(null);
  const [searchSantri, setSearchSantri] = useState('');
  
  const [nilaiList, setNilaiList] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
  const [semester, setSemester] = useState('GANJIL');
  const [loading, setLoading] = useState(false);

  // Efek untuk menyinkronkan pilihan santri saat pencarian memfilter keluar santri aktif
  useEffect(() => {
    if (user.role === 'ADMIN' && searchSantri && santriList.length > 0) {
      const filtered = santriList.filter(s =>
        s.nama.toLowerCase().includes(searchSantri.toLowerCase())
      );
      if (filtered.length > 0) {
        const exists = filtered.some(s => s.id === parseInt(selectedSantriId));
        if (!exists) {
          setSelectedSantriId(String(filtered[0].id));
          setCurrentSantriDetails(filtered[0]);
        }
      }
    }
  }, [searchSantri, santriList]);
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD or EDIT
  const [editingNilaiId, setEditingNilaiId] = useState(null);
  const [existingEntry, setExistingEntry] = useState(null); // entri duplikat yang akan digabung
  const [formNilai, setFormNilai] = useState({
    mataPelajaran: '',
    nilaiUts: '',
    nilaiUas: '',
  });

  const [jenisRaporCetak, setJenisRaporCetak] = useState('AKHIR'); // 'UTS', 'UAS', 'AKHIR'

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
      const url = user.role === 'ADMIN' 
        ? `/akademik/santri/${selectedSantriId}`
        : '/akademik/my';
        
      const response = await api.get(url, {
        params: { tahunAjaran, semester }
      });
      setNilaiList(response);

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
    setEditingNilaiId(null);
    setExistingEntry(null);
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
    setExistingEntry(null);
    setFormNilai({
      mataPelajaran: n.mataPelajaran,
      // Tampilkan string kosong jika null agar input tidak error
      nilaiUts: n.nilaiUts !== null && n.nilaiUts !== undefined ? n.nilaiUts.toString() : '',
      nilaiUas: n.nilaiUas !== null && n.nilaiUas !== undefined ? n.nilaiUas.toString() : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitNilai = async (e) => {
    e.preventDefault();
    const { mataPelajaran, nilaiUts, nilaiUas } = formNilai;

    if (!mataPelajaran) {
      alertDialog('Mata pelajaran wajib diisi', 'Validasi');
      return;
    }
    if (nilaiUts === '' && nilaiUas === '') {
      alertDialog('Minimal salah satu nilai (UTS atau UAS) harus diisi', 'Validasi');
      return;
    }

    // ⭐ DETEKSI DUPLIKAT: Jika mode ADD, cari apakah mapel ini sudah ada
    let targetId = editingNilaiId;
    let isUpsert = false;

    if (modalMode === 'ADD') {
      const duplicate = nilaiList.find(
        (n) => n.mataPelajaran.trim().toLowerCase() === mataPelajaran.trim().toLowerCase()
      );
      if (duplicate) {
        // Gunakan ID yang sudah ada, gabungkan nilai
        targetId = duplicate.id;
        isUpsert = true;
      }
    }

    // Jika upsert (gabung ke entri lama), nilai yang kosong = pakai nilai lama
    let finalUts = nilaiUts !== '' ? parseFloat(nilaiUts) : null;
    let finalUas = nilaiUas !== '' ? parseFloat(nilaiUas) : null;

    if (isUpsert && existingEntry) {
      // Kalau field dikosongkan, pertahankan nilai lama
      if (nilaiUts === '' && existingEntry.nilaiUts !== null) finalUts = existingEntry.nilaiUts;
      if (nilaiUas === '' && existingEntry.nilaiUas !== null) finalUas = existingEntry.nilaiUas;
    }

    const payload = {
      santriId: parseInt(selectedSantriId),
      mataPelajaran,
      nilaiUts: finalUts,
      nilaiUas: finalUas,
      semester,
      tahunAjaran
    };

    try {
      if (modalMode === 'ADD' && !isUpsert) {
        // Mapel baru, buat entri baru
        await api.post('/akademik', payload);
      } else {
        // Mapel sudah ada (upsert) atau mode EDIT biasa
        await api.put(`/akademik/${targetId}`, payload);
      }
      setIsModalOpen(false);
      setExistingEntry(null);
      fetchNilaiData();
    } catch (err) {
      alertDialog(err.message || 'Gagal menyimpan nilai', 'Gagal');
    }
  };

  // Deteksi real-time saat user ketik nama mapel di form ADD
  const handleMataPelajaranChange = (val) => {
    setFormNilai({ ...formNilai, mataPelajaran: val });
    if (modalMode === 'ADD') {
      const found = nilaiList.find(
        (n) => n.mataPelajaran.trim().toLowerCase() === val.trim().toLowerCase()
      );
      if (found) {
        setExistingEntry(found);
        // Auto-isi field dengan nilai lama supaya user bisa lihat dan edit
        setFormNilai(prev => ({
          ...prev,
          mataPelajaran: val,
          nilaiUts: found.nilaiUts !== null && found.nilaiUts !== undefined ? found.nilaiUts.toString() : '',
          nilaiUas: found.nilaiUas !== null && found.nilaiUas !== undefined ? found.nilaiUas.toString() : '',
        }));
      } else {
        setExistingEntry(null);
      }
    }
  };

  const handleDeleteNilai = async (id) => {
    if (!await confirmDialog('Hapus entri nilai ini?')) return;
    try {
      await api.delete(`/akademik/${id}`);
      fetchNilaiData();
    } catch (err) {
      alertDialog(err.message || 'Gagal menghapus nilai', 'Gagal');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Hitung rata-rata hanya dari nilai yang tersedia (UTS dan/atau UAS)
  const getAverage = (uts, uas) => {
    const hasUts = uts !== null && uts !== undefined;
    const hasUas = uas !== null && uas !== undefined;
    if (hasUts && hasUas) return ((parseFloat(uts) + parseFloat(uas)) / 2).toFixed(1);
    if (hasUts) return parseFloat(uts).toFixed(1);
    if (hasUas) return parseFloat(uas).toFixed(1);
    return '-';
  };

  const getHuruf = (score) => {
    if (score === '-') return '-';
    const s = parseFloat(score);
    if (s >= 85) return 'A';
    if (s >= 75) return 'B';
    if (s >= 65) return 'C';
    if (s >= 50) return 'D';
    return 'E';
  };

  const getKeterangan = (huruf) => {
    if (huruf === '-') return 'Belum Lengkap';
    if (huruf === 'A') return 'Sangat Baik (Mumtaz)';
    if (huruf === 'B') return 'Baik (Jayyid)';
    if (huruf === 'C') return 'Cukup (Maqbul)';
    if (huruf === 'D') return 'Kurang';
    return 'Kurang Sekali';
  };

  const totalNilai = nilaiList.reduce((acc, curr) => {
    const avg = getAverage(curr.nilaiUts, curr.nilaiUas);
    return avg !== '-' ? acc + parseFloat(avg) : acc;
  }, 0);
  const validCount = nilaiList.filter(n => getAverage(n.nilaiUts, n.nilaiUas) !== '-').length;
  const rataRataRapor = validCount > 0 ? (totalNilai / validCount).toFixed(1) : '-';

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH TITLE & ACTION BUTTON (+ TAMBAH NILAI) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#0B4A3F] flex items-center space-x-2">
            <GraduationCap className="text-[#D4AF37]" size={22} />
            <span>Modul Akademik & Pendidikan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Kelola penilaian evaluasi belajar dan pencetakan rapor santri.</p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === 'ADMIN' && (
            <button
              onClick={handleOpenAdd}
              className="bg-[#0B4A3F] hover:bg-[#083831] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-[#0B4A3F]/10 flex items-center space-x-1.5 transition transform active:scale-95 duration-200"
            >
              <Plus size={16} className="text-[#E8C766]" />
              <span>+ Tambah Nilai</span>
            </button>
          )}
          <select
            value={jenisRaporCetak}
            onChange={(e) => setJenisRaporCetak(e.target.value)}
            className="bg-[#0B4A3F]/10 text-[#0B4A3F] border border-[#0B4A3F]/20 rounded-xl px-3 py-2.5 text-xs font-bold outline-none no-print transition hover:bg-[#0B4A3F]/20"
          >
            <option value="AKHIR">Rapor Akhir Semester</option>
            <option value="UTS">Rapor UTS saja</option>
            <option value="UAS">Rapor UAS saja</option>
          </select>
          <button
            onClick={handlePrint}
            className="bg-[#083831] hover:bg-[#052b25] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
          >
            <Printer size={16} className="text-[#E8C766]" />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR (no-print) */}
      <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          {/* Dropdown Pilihan Santri dengan Pencarian Nama (Admin Only) */}
          {user.role === 'ADMIN' && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Cari & Pilih Santri</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama..."
                  value={searchSantri}
                  onChange={(e) => setSearchSantri(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none w-36 placeholder:text-slate-400"
                />
                <select
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none max-w-[200px]"
                >
                  {santriList
                    .filter(s => s.nama.toLowerCase().includes(searchSantri.toLowerCase()))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                    ))
                  }
                </select>
              </div>
            </div>
          )}

          {/* Tahun Ajaran */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Tahun Ajaran</label>
            <select
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>

          {/* Semester */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
            >
              <option value="GANJIL">GANJIL</option>
              <option value="GENAP">GENAP</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Santri: <strong className="text-[#0B4A3F]">{currentSantriDetails?.nama || '-'}</strong> ({currentSantriDetails?.kelas || '-'})
        </div>
      </div>

      {/* VIEW AKADEMIK TABLE (no-print) */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 no-print">
        <h2 className="text-base font-bold text-[#0B4A3F] font-serif mb-5 pb-2 border-b border-slate-100 flex items-center space-x-2">
          <BookOpen className="text-[#D4AF37]" size={20} />
          <span>Hasil Evaluasi Studi Santri — {currentSantriDetails?.nama}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#DCFCE7]/60 text-[#0B4A3F] font-extrabold uppercase tracking-wider border-b border-emerald-200/80">
                  <th className="py-3 px-4 rounded-tl-xl">MATA PELAJARAN PESANTREN</th>
                  <th className="py-3 px-4 text-center">NILAI UTS</th>
                  <th className="py-3 px-4 text-center">NILAI UAS</th>
                  <th className="py-3 px-4 text-center">RATA-RATA</th>
                  <th className="py-3 px-4 text-center">HURUF</th>
                  <th className="py-3 px-4">PREDIKAT / KETERANGAN</th>
                  {user.role === 'ADMIN' && <th className="py-3 px-4 text-center rounded-tr-xl">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nilaiList.length > 0 ? (
                  nilaiList.map((n) => {
                    const avg = getAverage(n.nilaiUts, n.nilaiUas);
                    const huruf = getHuruf(avg);
                    return (
                      <tr key={n.id} className="hover:bg-slate-100/60 transition duration-150">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{n.mataPelajaran}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">{n.nilaiUts}</td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">{n.nilaiUas}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-[#0B4A3F]">{avg}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block w-7 py-0.5 rounded-full font-bold text-center text-[11px] ${
                            huruf === 'A' ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/30' :
                            huruf === 'B' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                            huruf === 'C' ? 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30' :
                            'bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30'
                          }`}>
                            {huruf}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{getKeterangan(huruf)}</td>
                        {user.role === 'ADMIN' && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={() => handleOpenEdit(n)}
                                title="Edit Nilai"
                                className="p-1.5 text-[#16A34A] hover:bg-[#DCFCE7] rounded-full transition"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteNilai(n.id)}
                                title="Hapus Nilai"
                                className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-full transition"
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
        <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-4 mb-6">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
          <div className="flex-1 text-center pr-16">
            <h2 className="text-xl font-extrabold uppercase font-serif text-[#0B4A3F]">PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI</h2>
            <p className="text-[9px] text-slate-500 font-sans mt-0.5">
              Sekretariat : Kp. Babakan Nanggerang RT 02 RW 01 Desa Sukajadi Kec. Tarogong Kaler Kabupaten Garut Kode Pos 44151 Tlp. 083826250636
            </p>
          </div>
        </div>

        <h3 className="text-center text-sm font-bold underline uppercase tracking-wider mb-6">
          {jenisRaporCetak === 'UTS' ? `LAPORAN HASIL EVALUASI UTS SEMESTER ${semester}` : jenisRaporCetak === 'UAS' ? `LAPORAN HASIL EVALUASI UAS SEMESTER ${semester}` : `LAPORAN HASIL EVALUASI BELAJAR SANTRI (RAPOR SEMESTER ${semester})`}
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
                  <td className="font-bold text-slate-500 py-1">Kelas</td>
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
          {jenisRaporCetak === 'UTS' && (
            <>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-900 py-2.5 px-3 text-center w-8">No</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-left">Mata Pelajaran Pesantren</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-center w-24">Nilai UTS</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-center w-20">Nilai Huruf</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-left w-48">Kriteria Ketuntasan</th>
                </tr>
              </thead>
              <tbody>
                {nilaiList.length > 0 ? (
                  nilaiList.map((n, i) => {
                    const score = n.nilaiUts !== null && n.nilaiUts !== undefined ? n.nilaiUts : '-';
                    const huruf = score !== '-' ? getHuruf(score) : '-';
                    return (
                      <tr key={n.id}>
                        <td className="border border-slate-900 py-2 px-3 text-center">{i + 1}</td>
                        <td className="border border-slate-900 py-2 px-3 font-semibold">{n.mataPelajaran}</td>
                        <td className="border border-slate-900 py-2 px-3 text-center">{score}</td>
                        <td className="border border-slate-900 py-2 px-3 text-center font-bold">{huruf}</td>
                        <td className="border border-slate-900 py-2 px-3">{getKeterangan(huruf)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="border border-slate-900 py-6 text-center text-slate-400">
                      Tidak ada data nilai rapor untuk semester ini.
                    </td>
                  </tr>
                )}
                {(() => {
                  const totalUts = nilaiList.reduce((acc, curr) => curr.nilaiUts !== null && curr.nilaiUts !== undefined ? acc + curr.nilaiUts : acc, 0);
                  const countUts = nilaiList.filter(n => n.nilaiUts !== null && n.nilaiUts !== undefined).length;
                  const avgUts = countUts > 0 ? (totalUts / countUts).toFixed(1) : '-';
                  return (
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan="2" className="border border-slate-900 py-2 px-3 text-right">Nilai Rata-Rata Akumulasi UTS</td>
                      <td className="border border-slate-900 py-2 px-3 text-center text-[#0B4A3F] text-sm">{avgUts}</td>
                      <td colSpan="2" className="border border-slate-900 py-2 px-3 text-left uppercase text-[10px]">
                        {avgUts !== '-' ? `Predikat: ${getKeterangan(getHuruf(avgUts))}` : ''}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </>
          )}

          {jenisRaporCetak === 'UAS' && (
            <>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-900 py-2.5 px-3 text-center w-8">No</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-left">Mata Pelajaran Pesantren</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-center w-24">Nilai UAS</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-center w-20">Nilai Huruf</th>
                  <th className="border border-slate-900 py-2.5 px-3 text-left w-48">Kriteria Ketuntasan</th>
                </tr>
              </thead>
              <tbody>
                {nilaiList.length > 0 ? (
                  nilaiList.map((n, i) => {
                    const score = n.nilaiUas !== null && n.nilaiUas !== undefined ? n.nilaiUas : '-';
                    const huruf = score !== '-' ? getHuruf(score) : '-';
                    return (
                      <tr key={n.id}>
                        <td className="border border-slate-900 py-2 px-3 text-center">{i + 1}</td>
                        <td className="border border-slate-900 py-2 px-3 font-semibold">{n.mataPelajaran}</td>
                        <td className="border border-slate-900 py-2 px-3 text-center">{score}</td>
                        <td className="border border-slate-900 py-2 px-3 text-center font-bold">{huruf}</td>
                        <td className="border border-slate-900 py-2 px-3">{getKeterangan(huruf)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="border border-slate-900 py-6 text-center text-slate-400">
                      Tidak ada data nilai rapor untuk semester ini.
                    </td>
                  </tr>
                )}
                {(() => {
                  const totalUas = nilaiList.reduce((acc, curr) => curr.nilaiUas !== null && curr.nilaiUas !== undefined ? acc + curr.nilaiUas : acc, 0);
                  const countUas = nilaiList.filter(n => n.nilaiUas !== null && n.nilaiUas !== undefined).length;
                  const avgUas = countUas > 0 ? (totalUas / countUas).toFixed(1) : '-';
                  return (
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan="2" className="border border-slate-900 py-2 px-3 text-right">Nilai Rata-Rata Akumulasi UAS</td>
                      <td className="border border-slate-900 py-2 px-3 text-center text-[#0B4A3F] text-sm">{avgUas}</td>
                      <td colSpan="2" className="border border-slate-900 py-2 px-3 text-left uppercase text-[10px]">
                        {avgUas !== '-' ? `Predikat: ${getKeterangan(getHuruf(avgUas))}` : ''}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </>
          )}

          {jenisRaporCetak === 'AKHIR' && (
            <>
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
                        <td className="border border-slate-900 py-2 px-3 text-center">
                          {n.nilaiUts !== null && n.nilaiUts !== undefined ? n.nilaiUts : <span className="text-slate-300 text-[10px]">-</span>}
                        </td>
                        <td className="border border-slate-900 py-2 px-3 text-center">
                          {n.nilaiUas !== null && n.nilaiUas !== undefined ? n.nilaiUas : <span className="text-slate-300 text-[10px]">-</span>}
                        </td>
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
                  <td className="border border-slate-900 py-2 px-3 text-center text-[#0B4A3F] text-sm">{rataRataRapor}</td>
                  <td colSpan="2" className="border border-slate-900 py-2 px-3 text-left uppercase text-[10px]">
                    {rataRataRapor !== '-' ? `Predikat: ${getKeterangan(getHuruf(rataRataRapor))}` : ''}
                  </td>
                </tr>
              </tbody>
            </>
          )}
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
            <p>Ditetapkan di Garut,</p>
            <p className="font-bold">Wali Kelas</p>
            <div className="h-16"></div>
            <p className="underline font-bold">______________________</p>
            <p className="text-[10px] text-slate-500">NIP. ______________________</p>
          </div>
          <div>
            <p>Mengesahkan,</p>
            <p className="font-bold">PIMPINAN PONDOK PESANTREN</p>
            <div className="h-16"></div>
            <p className="underline font-bold">K.M QUSYAERI AHMAD FAUZI</p>
            <p className="text-[10px] text-slate-500 font-bold">Pimpinan Miftahul Huda As-syadzili</p>
          </div>
        </div>
      </div>

      {/* MODAL INPUT / EDIT NILAI (no-print) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#083831]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#D4AF37]/30">
            <div className="p-5 bg-[#0B4A3F] text-white font-serif font-bold text-base flex justify-between items-center border-b border-[#D4AF37]/30">
              <span>{modalMode === 'EDIT' ? 'Edit Nilai Akademik' : existingEntry ? '⟳ Perbarui Nilai Mapel' : 'Input Nilai Akademik Baru'}</span>
              <button onClick={() => { setIsModalOpen(false); setExistingEntry(null); }} className="text-emerald-200 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmitNilai} className="p-6 space-y-4">

              {/* Banner: Mapel sudah ada, nilai akan digabung */}
              {existingEntry && modalMode === 'ADD' && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800">
                  <span className="text-amber-500 text-base leading-none">⚠</span>
                  <div>
                    <p className="font-bold text-amber-700 mb-0.5">Mata pelajaran ini sudah ada!</p>
                    <p>Nilai lama: <strong>UTS={existingEntry.nilaiUts ?? '-'}</strong> / <strong>UAS={existingEntry.nilaiUas ?? '-'}</strong>.</p>
                    <p className="mt-0.5">Form sudah diisi dengan nilai lama. Ubah nilai yang ingin diperbarui, lalu simpan — kedua nilai akan <strong>digabung</strong> dalam satu baris.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formNilai.mataPelajaran}
                  onChange={(e) => handleMataPelajaranChange(e.target.value)}
                  readOnly={modalMode === 'EDIT'}
                  className={`w-full bg-slate-50 border rounded-xl p-2.5 text-xs focus:bg-white focus:border-[#D4AF37] outline-none ${modalMode === 'EDIT' ? 'border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nilai UTS</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formNilai.nilaiUts}
                    onChange={(e) => setFormNilai({ ...formNilai, nilaiUts: e.target.value })}
                    placeholder="Opsional (0 - 100)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Kosongkan jika belum ada</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#0B4A3F] uppercase tracking-wider mb-1">Nilai UAS</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formNilai.nilaiUas}
                    onChange={(e) => setFormNilai({ ...formNilai, nilaiUas: e.target.value })}
                    placeholder="Opsional (0 - 100)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:bg-white focus:border-[#D4AF37] outline-none"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Kosongkan jika belum ada</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-2 text-[10px] text-slate-500">
                <Calendar size={14} className="text-[#D4AF37]" />
                <span>Tersimpan pada <strong>Semester {semester}</strong> Tahun Ajaran <strong>{tahunAjaran}</strong>.</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${existingEntry ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0B4A3F] hover:bg-[#083831]'} text-white rounded-xl font-bold text-xs shadow-md transition`}
                >
                  {existingEntry && modalMode === 'ADD' ? '⟳ Gabung & Simpan' : 'Simpan Nilai'}
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

