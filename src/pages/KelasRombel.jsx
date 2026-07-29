import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, ChevronRight, AlertCircle, ArrowUpCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

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

function KelasRombel() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data santri');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteIndividual = async (id, currentClass, nextClassOverride) => {
    const next = nextClassOverride || getNextClass(currentClass);
    if (!next) return;

    const confirmMsg = next === 'LULUS'
      ? 'Santri akan diluluskan dan dinonaktifkan dari daftar aktif. Lanjutkan?'
      : `Promosikan santri ke kelas ${next}?`;

    if (!window.confirm(confirmMsg)) return;

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

    if (!window.confirm(confirmMsg)) return;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                        <th className="py-2.5 px-6">NAMA LENGKAP</th>
                        <th className="py-2.5 px-6">NOMOR HP WALI</th>
                        <th className="py-2.5 px-6">ALAMAT</th>
                        <th className="py-2.5 px-6 text-center">AKSI PROMOSI KELAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-6 font-bold text-slate-800">{s.nama}</td>
                          <td className="py-3 px-6 text-slate-500 font-mono">{s.noHp || '-'}</td>
                          <td className="py-3 px-6 text-slate-550 max-w-xs truncate">{s.alamat || '-'}</td>
                          <td className="py-3 px-6 text-center">
                            {nextClass ? (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handlePromoteIndividual(s.id, className)}
                                  className="bg-emerald-50 hover:bg-[#DCFCE7] text-[#16A34A] text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-[#16A34A]/20 transition flex items-center space-x-1 uppercase"
                                >
                                  <span>Naik Kelas</span>
                                  <ChevronRight size={10} />
                                </button>
                                
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
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Santri Tingkat Akhir</span>
                            )}
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
                      <th className="py-2.5 px-6">NAMA LENGKAP</th>
                      <th className="py-2.5 px-6">KELAS SAAT INI</th>
                      <th className="py-2.5 px-6 text-center">TENTUKAN KELAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unsorted.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
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
    </div>
  );
}

export default KelasRombel;
