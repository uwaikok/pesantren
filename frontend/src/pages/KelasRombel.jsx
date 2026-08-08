import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, ChevronRight, ChevronLeft, AlertCircle, ArrowUpCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { confirmDialog } from '../utils/dialog';

const CLASS_ORDER = [
  'Imdad Putra',
  'Imdad Putri',
  'Ibtida 1 Putra',
  'Ibtida 1 Putri',
  'Ibtida 2 Putra',
  'Ibtida 2 Putri',
  'Ibtida 3',
  'Tsanawi 1',
  'Tsanawi 2',
  'Tsanawi 3'
];

const PROGRESSION_MAP = {
  'Imdad Putra': 'Ibtida 1 Putra',
  'Imdad Putri': 'Ibtida 1 Putri',
  'Ibtida 1 Putra': 'Ibtida 2 Putra',
  'Ibtida 1 Putri': 'Ibtida 2 Putri',
  'Ibtida 2 Putra': 'Ibtida 3',
  'Ibtida 2 Putri': 'Ibtida 3',
  'Ibtida 3': 'Tsanawi 1',
  'Tsanawi 1': 'Tsanawi 2',
  'Tsanawi 2': 'Tsanawi 3',
  'Tsanawi 3': 'LULUS'
};

const getNextClass = (currentClass) => {
  return PROGRESSION_MAP[currentClass] || null;
};

const getPrevClass = (currentClass, studentName) => {
  const prevMap = {
    'Ibtida 1 Putra': 'Imdad Putra',
    'Ibtida 1 Putri': 'Imdad Putri',
    'Ibtida 2 Putra': 'Ibtida 1 Putra',
    'Ibtida 2 Putri': 'Ibtida 1 Putri',
    'Ibtida 3': 'IBTIDA_2',
    'Tsanawi 1': 'Ibtida 3',
    'Tsanawi 2': 'Tsanawi 1',
    'Tsanawi 3': 'Tsanawi 2'
  };

  let prev = prevMap[currentClass] || null;
  if (prev === 'IBTIDA_2') {
    const nameLower = String(studentName).toLowerCase();
    const isFemale = nameLower.includes('putri') || nameLower.includes('binti') || nameLower.includes(' siti ') || nameLower.startsWith('siti');
    return isFemale ? 'Ibtida 2 Putri' : 'Ibtida 2 Putra';
  }
  return prev;
};

function KelasRombel() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all students (only active)
      const list = await api.get('/admin/santri');
      setStudents(list.filter(s => s.status === 'ACTIVE'));
      setSelectedIds([]); // Reset selection on refresh
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data santri');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllInClass = (className, classStudents) => {
    const classIds = classStudents.map(s => s.id);
    const allSelected = classIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !classIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...classIds])]);
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleDemoteIndividual = async (id, currentClass, studentName) => {
    const prev = getPrevClass(currentClass, studentName);
    if (!prev) return;

    if (!await confirmDialog(`Turunkan santri ke kelas ${prev}?`)) return;

    try {
      setError('');
      setSuccessMsg('');
      await api.put(`/admin/santri/${id}`, { kelas: prev });
      setSuccessMsg('Penurunan kelas berhasil diproses');
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Gagal memproses penurunan kelas');
    }
  };

  const handlePromoteIndividual = async (id, currentClass, nextClassOverride) => {
    const next = nextClassOverride || getNextClass(currentClass);
    if (!next) return;

    const confirmMsg = next === 'LULUS'
      ? 'Santri akan diluluskan dan dinonaktifkan dari daftar aktif. Lanjutkan?'
      : `Promosikan santri ke kelas ${next}?`;

    if (!await confirmDialog(confirmMsg)) return;

    try {
      setError('');
      setSuccessMsg('');
      if (next === 'LULUS') {
        await api.put(`/admin/santri/${id}`, { status: 'INACTIVE' });
      } else {
        await api.put(`/admin/santri/${id}`, { kelas: next });
      }
      setSuccessMsg('Kenaikan kelas berhasil diproses');
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Gagal memproses kenaikan kelas');
    }
  };

  const handlePromoteBulk = async (className) => {
    const classStudents = students.filter(s => s.kelas === className);
    if (classStudents.length === 0) return;

    const next = getNextClass(className);
    if (!next) return;

    const confirmMsg = next === 'LULUS'
      ? `Apakah Anda yakin ingin meluluskan (menonaktifkan) seluruh santri (${classStudents.length} orang) di kelas ${className}?`
      : `Apakah Anda yakin ingin menaikkan seluruh santri (${classStudents.length} orang) dari kelas ${className} ke ${next}?`;

    if (!await confirmDialog(confirmMsg)) return;

    try {
      setError('');
      setSuccessMsg('');
      const studentIds = classStudents.map(s => s.id);

      if (next === 'LULUS') {
        await api.put('/admin/santri/promote/bulk', { studentIds, status: 'INACTIVE' });
      } else {
        await api.put('/admin/santri/promote/bulk', { studentIds, nextClass: next });
      }

      setSuccessMsg(`Berhasil menaikkan seluruh santri kelas ${className}`);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Gagal memproses kenaikan kelas massal');
    }
  };

  const handleBulkAction = async (actionType, targetClass = null) => {
    if (selectedIds.length === 0) return;

    const selectedStudents = students.filter(s => selectedIds.includes(s.id));
    const studentCount = selectedIds.length;
    const updates = [];
    let confirmMsg = '';

    if (actionType === 'PROMOTE') {
      selectedStudents.forEach(s => {
        const next = getNextClass(s.kelas);
        if (next) {
          if (next === 'LULUS') {
            updates.push({ id: s.id, status: 'INACTIVE' });
          } else {
            updates.push({ id: s.id, kelas: next });
          }
        }
      });
      confirmMsg = `Anda akan menaikkan ${studentCount} santri terpilih ke tingkatan kelas berikutnya.`;
    } else if (actionType === 'DEMOTE') {
      selectedStudents.forEach(s => {
        const prev = getPrevClass(s.kelas, s.nama);
        if (prev) {
          updates.push({ id: s.id, kelas: prev });
        }
      });
      confirmMsg = `Anda akan menurunkan ${studentCount} santri terpilih ke tingkatan kelas sebelumnya.`;
    } else if (actionType === 'KEEP') {
      selectedStudents.forEach(s => {
        updates.push({ id: s.id, kelas: s.kelas });
      });
      confirmMsg = `Anda akan menandai ${studentCount} santri terpilih tetap berada di rombel kelas saat ini untuk tahun ajaran baru.`;
    } else if (actionType === 'MOVE' && targetClass) {
      selectedStudents.forEach(s => {
        if (targetClass === 'LULUS') {
          updates.push({ id: s.id, status: 'INACTIVE' });
        } else {
          updates.push({ id: s.id, kelas: targetClass });
        }
      });
      confirmMsg = `Anda akan memindahkan ${studentCount} santri terpilih ke kelas ${targetClass === 'LULUS' ? 'Alumni / Lulus' : targetClass}.`;
    }

    if (updates.length === 0) {
      setError('Tidak ada tindakan yang valid untuk santri terpilih.');
      return;
    }

    // List names, showing max 10 to keep confirm box readable
    const nameList = selectedStudents.length <= 10
      ? selectedStudents.map(s => `• ${s.nama}`).join('\n')
      : selectedStudents.slice(0, 10).map(s => `• ${s.nama}`).join('\n') + `\n• ... dan ${selectedStudents.length - 10} santri lainnya`;

    const fullConfirmMsg = `${confirmMsg}\n\nDaftar santri yang terpengaruh:\n${nameList}\n\nLanjutkan?`;

    if (!await confirmDialog(fullConfirmMsg)) return;

    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      await api.put('/admin/santri/batch-update', { updates });

      const targetClassName = targetClass ? (targetClass === 'LULUS' ? 'Alumni' : targetClass) : 'tingkatan baru';
      setSuccessMsg(`${studentCount} santri berhasil dipindahkan.`);
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Gagal memproses aksi massal');
      setLoading(false);
    }
  };

  const getCommonClass = () => {
    if (selectedIds.length === 0) return null;
    const selectedStudents = students.filter(s => selectedIds.includes(s.id));
    const firstClass = selectedStudents[0]?.kelas;
    const allSame = selectedStudents.every(s => s.kelas === firstClass);
    return allSame ? firstClass : null;
  };

  const commonClass = getCommonClass();
  const nextTargetClass = commonClass ? getNextClass(commonClass) : null;
  const prevTargetClass = commonClass ? getPrevClass(commonClass, '') : null; // Blank name bypass for generic prev label

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37]">
        <h2 className="text-lg font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
          <GraduationCap size={24} className="text-[#D4AF37]" />
          <span>Kenaikan Kelas & Manajemen Rombel</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Halaman ini digunakan setiap akhir tahun ajaran untuk menentukan kenaikan kelas santri secara bulk (massal) maupun individu berdasarkan demografi tingkatan kelas.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-xl text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Class list loop ordered by demographics */}
      <div className="space-y-6">
        {CLASS_ORDER.map((className) => {
          const classStudents = students.filter(s => s.kelas === className);
          const nextClass = getNextClass(className);

          return (
            <div key={className} className="bg-white rounded-2xl shadow-soft border border-slate-200/80 overflow-hidden">
              {/* Card Header */}
              <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B4A3F] flex items-center justify-center font-bold font-serif border border-emerald-100">
                    {className.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{className}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {classStudents.length} Santri Aktif
                    </p>
                  </div>
                </div>

                {/* Bulk promotion button */}
                {classStudents.length > 0 && nextClass && (
                  <button
                    onClick={() => handlePromoteBulk(className)}
                    className="self-start sm:self-center bg-[#0B4A3F] hover:bg-[#083831] text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition duration-150 flex items-center space-x-2 border border-[#D4AF37]/20"
                  >
                    <ArrowUpCircle size={14} className="text-[#E8C766]" />
                    <span>Naikkan Semua ke {nextClass === 'LULUS' ? 'Alumni / Lulus' : nextClass}</span>
                  </button>
                )}
              </div>

              {/* Card Body - Students List */}
              <div className="p-0 overflow-x-auto">
                {classStudents.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <th className="py-2.5 px-4 text-center w-12">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-555 cursor-pointer"
                            checked={classStudents.length > 0 && classStudents.every(s => selectedIds.includes(s.id))}
                            onChange={() => handleSelectAllInClass(className, classStudents)}
                          />
                        </th>
                        <th className="py-2.5 px-6">NAMA LENGKAP</th>
                        <th className="py-2.5 px-6">NOMOR HP WALI</th>
                        <th className="py-2.5 px-6">ALAMAT</th>
                        <th className="py-2.5 px-6 text-center">AKSI PROMOSI KELAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map((s) => (
                        <tr key={s.id} className={`hover:bg-slate-50/50 transition ${selectedIds.includes(s.id) ? 'bg-emerald-50/30' : ''}`}>
                          <td className="py-3 px-4 text-center">
                            <input 
                              type="checkbox"
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-555 cursor-pointer"
                              checked={selectedIds.includes(s.id)}
                              onChange={() => handleSelectStudent(s.id)}
                            />
                          </td>
                          <td className="py-3 px-6 font-bold text-slate-800">{s.nama}</td>
                          <td className="py-3 px-6 text-slate-500 font-mono">{s.noHp || '-'}</td>
                          <td className="py-3 px-6 text-slate-550 max-w-xs truncate">{s.alamat || '-'}</td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {/* Tombol Turun Kelas */}
                              {getPrevClass(className, s.nama) && (
                                <button
                                  onClick={() => handleDemoteIndividual(s.id, className, s.nama)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-amber-550/20 transition flex items-center space-x-1 uppercase"
                                >
                                  <ChevronLeft size={10} />
                                  <span>Turun Kelas</span>
                                </button>
                              )}

                              {/* Tombol Naik Kelas */}
                              {nextClass && (
                                <button
                                  onClick={() => handlePromoteIndividual(s.id, className)}
                                  className="bg-emerald-50 hover:bg-[#DCFCE7] text-[#16A34A] text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-[#16A34A]/20 transition flex items-center space-x-1 uppercase"
                                >
                                  <span>Naik Kelas</span>
                                  <ChevronRight size={10} />
                                </button>
                              )}

                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handlePromoteIndividual(s.id, className, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-650 text-[10px] font-bold py-1 px-2 rounded-lg outline-none"
                              >
                                <option value="">Ubah ke...</option>
                                {CLASS_ORDER.map(c => c !== className && <option key={c} value={c}>{c}</option>)}
                                <option value="LULUS">Lulus / Alumni</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Tidak ada santri di rombel kelas ini.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Students with undefined class */}
        {(() => {
          const unsorted = students.filter(s => !s.kelas || !CLASS_ORDER.includes(s.kelas));
          if (unsorted.length === 0) return null;

          return (
            <div className="bg-white rounded-2xl shadow-soft border border-slate-200/80 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-amber-50/50 to-white border-b border-slate-100">
                <h3 className="font-bold text-sm text-amber-800 flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>Rombel Tidak Valid / Belum Ditentukan</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  {unsorted.length} Santri
                </p>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-4 text-center w-12">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-555 cursor-pointer"
                          checked={unsorted.length > 0 && unsorted.every(s => selectedIds.includes(s.id))}
                          onChange={() => handleSelectAllInClass('unsorted', unsorted)}
                        />
                      </th>
                      <th className="py-2.5 px-6">NAMA LENGKAP</th>
                      <th className="py-2.5 px-6">KELAS SAAT INI</th>
                      <th className="py-2.5 px-6 text-center">TENTUKAN KELAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unsorted.map((s) => (
                      <tr key={s.id} className={`hover:bg-slate-50/50 transition ${selectedIds.includes(s.id) ? 'bg-emerald-50/30' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-555 cursor-pointer"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => handleSelectStudent(s.id)}
                          />
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-800">{s.nama}</td>
                        <td className="py-3 px-6 text-slate-500 font-medium italic">{s.kelas || 'Belum Ditentukan'}</td>
                        <td className="py-3 px-6 text-center">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handlePromoteIndividual(s.id, null, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-650 text-[10px] font-bold py-1 px-2.5 rounded-lg outline-none"
                          >
                            <option value="">Pilih Kelas...</option>
                            {CLASS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Floating Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#0B4A3F]/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-[#D4AF37]/30 flex flex-col md:flex-row items-center gap-4 max-w-full w-[95%] sm:w-[90%] md:w-auto animate-fade-in-up">
          <div className="flex items-center space-x-3">
            <div className="bg-[#D4AF37] text-[#0B4A3F] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
              {selectedIds.length}
            </div>
            <span className="text-xs font-bold font-serif tracking-wide text-slate-100">
              santri terpilih
            </span>
          </div>

          <div className="h-px w-full md:h-6 md:w-px bg-slate-200/20"></div>

          <div className="flex flex-wrap items-center gap-2 justify-center">
            {/* Naik Kelas */}
            <button
              onClick={() => handleBulkAction('PROMOTE')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-2 rounded-xl transition uppercase flex items-center space-x-1 shadow-sm"
            >
              <span>{commonClass && nextTargetClass ? `Naikkan ke ${nextTargetClass}` : 'Naikkan Kelas'}</span>
            </button>

            {/* Turun Kelas */}
            <button
              onClick={() => handleBulkAction('DEMOTE')}
              disabled={commonClass && !prevTargetClass}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[10px] font-extrabold px-3 py-2 rounded-xl transition uppercase flex items-center space-x-1 shadow-sm"
            >
              <span>{commonClass && prevTargetClass ? `Turunkan ke ${prevTargetClass}` : 'Turun Kelas'}</span>
            </button>

            {/* Tetap di Kelas */}
            <button
              onClick={() => handleBulkAction('KEEP')}
              className="bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-extrabold px-3 py-2 rounded-xl transition uppercase flex items-center space-x-1 shadow-sm"
            >
              <span>Tetap di Kelas</span>
            </button>

            {/* Pindahkan Ke */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction('MOVE', e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-[10px] font-extrabold py-2 px-3 rounded-xl outline-none cursor-pointer"
            >
              <option value="">Pindahkan ke...</option>
              {CLASS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="LULUS">Lulus / Alumni</option>
            </select>

            <button
              onClick={clearSelection}
              className="text-[10px] font-bold text-slate-350 hover:text-white px-2 py-2 transition"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelasRombel;
