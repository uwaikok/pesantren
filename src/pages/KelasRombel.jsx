import React, { useState, useEffect } from 'react';
import { GraduationCap, AlertCircle, ArrowUpCircle, CheckCircle, ArrowUp, ArrowDown, Minus, ArrowLeftRight, X } from 'lucide-react';
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

const getNextClass = (currentClass) => PROGRESSION_MAP[currentClass] || null;

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

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await api.get('/admin/santri');
      setStudents(list.filter(s => s.status === 'ACTIVE'));
      setSelectedIds([]);
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

  // Masih digunakan oleh seksi "Rombel Tidak Valid" untuk assign kelas awal
  const handleAssignClass = async (id, targetClass) => {
    if (!targetClass) return;
    const confirmMsg = `Tentukan kelas santri ini menjadi ${targetClass}?`;
    if (!await confirmDialog(confirmMsg)) return;
    try {
      setError(''); setSuccessMsg('');
      await api.put(`/admin/santri/${id}`, { kelas: targetClass });
      setSuccessMsg('Kelas santri berhasil ditentukan');
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Gagal menentukan kelas santri');
    }
  };

  const handlePromoteBulk = async (className) => {
    const classStudents = students.filter(s => s.kelas === className);
    if (classStudents.length === 0) return;
    const next = getNextClass(className);
    if (!next) return;
    const confirmMsg = next === 'LULUS'
      ? `Apakah Anda yakin ingin meluluskan seluruh santri (${classStudents.length} orang) di kelas ${className}?`
      : `Apakah Anda yakin ingin menaikkan seluruh santri (${classStudents.length} orang) dari kelas ${className} ke ${next}?`;
    if (!await confirmDialog(confirmMsg)) return;
    try {
      setError(''); setSuccessMsg('');
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
        if (next) updates.push(next === 'LULUS' ? { id: s.id, status: 'INACTIVE' } : { id: s.id, kelas: next });
      });
      confirmMsg = `Anda akan menaikkan ${studentCount} santri terpilih ke tingkatan kelas berikutnya.`;
    } else if (actionType === 'DEMOTE') {
      selectedStudents.forEach(s => {
        const prev = getPrevClass(s.kelas, s.nama);
        if (prev) updates.push({ id: s.id, kelas: prev });
      });
      confirmMsg = `Anda akan menurunkan ${studentCount} santri terpilih ke tingkatan kelas sebelumnya.`;
    } else if (actionType === 'KEEP') {
      selectedStudents.forEach(s => updates.push({ id: s.id, kelas: s.kelas }));
      confirmMsg = `Anda akan menandai ${studentCount} santri terpilih tetap berada di rombel kelas saat ini.`;
    } else if (actionType === 'MOVE' && targetClass) {
      selectedStudents.forEach(s => {
        updates.push(targetClass === 'LULUS' ? { id: s.id, status: 'INACTIVE' } : { id: s.id, kelas: targetClass });
      });
      confirmMsg = `Anda akan memindahkan ${studentCount} santri terpilih ke kelas ${targetClass === 'LULUS' ? 'Alumni / Lulus' : targetClass}.`;
    }

    if (updates.length === 0) { setError('Tidak ada tindakan yang valid untuk santri terpilih.'); return; }

    const nameList = selectedStudents.length <= 10
      ? selectedStudents.map(s => `• ${s.nama}`).join('\n')
      : selectedStudents.slice(0, 10).map(s => `• ${s.nama}`).join('\n') + `\n• ... dan ${selectedStudents.length - 10} santri lainnya`;

    if (!await confirmDialog(`${confirmMsg}\n\nDaftar santri yang terpengaruh:\n${nameList}\n\nLanjutkan?`)) return;

    try {
      setError(''); setSuccessMsg(''); setLoading(true);
      await api.put('/admin/santri/batch-update', { updates });
      setSuccessMsg(`${studentCount} santri berhasil dipindahkan.`);
      setSelectedIds([]);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Gagal memproses aksi massal');
      setLoading(false);
    }
  };

  const commonClass = (() => {
    if (selectedIds.length === 0) return null;
    const sel = students.filter(s => selectedIds.includes(s.id));
    const first = sel[0]?.kelas;
    return sel.every(s => s.kelas === first) ? first : null;
  })();
  const nextTargetClass = commonClass ? getNextClass(commonClass) : null;
  const prevTargetClass = commonClass ? getPrevClass(commonClass, '') : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#0B4A3F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200/80 border-t-3 border-t-[#D4AF37]">
        <h2 className="text-lg font-bold text-[#0B4A3F] font-serif flex items-center space-x-2">
          <GraduationCap size={24} className="text-[#D4AF37]" />
          <span>Kenaikan Kelas & Manajemen Rombel</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Gunakan checkbox untuk memilih santri, lalu gunakan toolbar aksi massal di bawah untuk menaikkan, menurunkan, atau memindahkan kelas santri terpilih sekaligus.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-xl text-xs font-semibold">⚠️ {error}</div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle size={16} /><span>{successMsg}</span>
        </div>
      )}

      {/* Class list */}
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
                {/* Tombol Naikkan Semua — tetap dipertahankan */}
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

              {/* Tabel Santri — hanya 4 kolom: Checkbox, Nama, HP, Alamat */}
              <div className="p-0 overflow-x-auto">
                {classStudents.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <th className="py-2.5 px-4 text-center w-12">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded cursor-pointer accent-[#0B4A3F]"
                            checked={classStudents.length > 0 && classStudents.every(s => selectedIds.includes(s.id))}
                            onChange={() => handleSelectAllInClass(className, classStudents)}
                          />
                        </th>
                        <th className="py-2.5 px-6">NAMA LENGKAP</th>
                        <th className="py-2.5 px-6 w-48">NOMOR HP WALI</th>
                        <th className="py-2.5 px-6">ALAMAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map((s) => (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/60 transition cursor-pointer ${selectedIds.includes(s.id) ? 'bg-emerald-50/40' : ''}`}
                          onClick={() => handleSelectStudent(s.id)}
                        >
                          <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded cursor-pointer accent-[#0B4A3F]"
                              checked={selectedIds.includes(s.id)}
                              onChange={() => handleSelectStudent(s.id)}
                            />
                          </td>
                          <td className="py-3 px-6 font-bold text-slate-800">{s.nama}</td>
                          <td className="py-3 px-6 text-slate-500 font-mono w-48">{s.noHp || '-'}</td>
                          <td className="py-3 px-6 text-slate-500">{s.alamat || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">Tidak ada santri di rombel kelas ini.</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Santri belum punya kelas valid */}
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
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{unsorted.length} Santri</p>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-4 text-center w-12">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded cursor-pointer accent-[#0B4A3F]"
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
                      <tr key={s.id} className={`hover:bg-slate-50/50 transition ${selectedIds.includes(s.id) ? 'bg-emerald-50/40' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded cursor-pointer accent-[#0B4A3F]"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => handleSelectStudent(s.id)}
                          />
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-800">{s.nama}</td>
                        <td className="py-3 px-6 text-slate-500 font-medium italic">{s.kelas || 'Belum Ditentukan'}</td>
                        <td className="py-3 px-6 text-center">
                          <select
                            onChange={(e) => { if (e.target.value) { handleAssignClass(s.id, e.target.value); e.target.value = ''; } }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold py-1 px-2.5 rounded-lg outline-none cursor-pointer"
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

      {/* ─── Floating Bulk Action Toolbar (Redesigned) ─── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-3xl">
          <div className="bg-[#083831] backdrop-blur-xl text-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] border border-[#D4AF37]/25 overflow-hidden">

            {/* ── Baris 1: Counter + Tombol Utama + Batal ── */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2 flex-wrap">

              {/* Kiri: Counter badge */}
              <div className="flex items-center gap-2.5 shrink-0 mr-1">
                <div className="bg-[#D4AF37] text-[#0B4A3F] font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md shrink-0">
                  {selectedIds.length}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-white">santri terpilih</p>
                  <p className="text-[9px] text-emerald-400/80 font-medium">siap diproses</p>
                </div>
              </div>

              {/* Separator */}
              <div className="hidden sm:block w-px h-9 bg-white/15 shrink-0"></div>

              {/* Tombol PRIMER — paling menonjol */}
              <button
                onClick={() => handleBulkAction('PROMOTE')}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/40 uppercase tracking-wide shrink-0"
              >
                <ArrowUp size={14} strokeWidth={3} />
                <span>
                  {commonClass && nextTargetClass && nextTargetClass !== 'LULUS'
                    ? `Naikkan ke ${nextTargetClass}`
                    : 'Naikkan Kelas'}
                </span>
              </button>

              {/* Spacer mendorong Batal ke ujung kanan */}
              <div className="flex-1"></div>

              {/* Batal — ujung kanan, terpisah jauh dari aksi transaksi */}
              <button
                onClick={clearSelection}
                className="flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-emerald-300/70 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-white/15"
              >
                <X size={13} />
                <span>Batal</span>
              </button>
            </div>

            {/* Separator tipis antar baris */}
            <div className="mx-4 h-px bg-white/8"></div>

            {/* ── Baris 2: Tombol Sekunder + Dropdown ── */}
            <div className="flex items-center gap-2 px-4 pt-2 pb-3.5 flex-wrap">

              {/* Turun Kelas — sekunder/outline */}
              <button
                onClick={() => handleBulkAction('DEMOTE')}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase transition-all border border-amber-500/50 text-amber-300 hover:bg-amber-600/30 hover:border-amber-400 active:scale-95"
              >
                <ArrowDown size={11} strokeWidth={2.5} />
                <span>
                  {commonClass && prevTargetClass
                    ? `Turun ke ${prevTargetClass}`
                    : 'Turun Kelas'}
                </span>
              </button>

              {/* Tetap di Kelas — sekunder/outline */}
              <button
                onClick={() => handleBulkAction('KEEP')}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase transition-all border border-slate-500/50 text-slate-300 hover:bg-slate-500/30 hover:border-slate-400 active:scale-95"
              >
                <Minus size={11} strokeWidth={2.5} />
                <span>Tetap di Kelas</span>
              </button>

              {/* Separator kecil */}
              <div className="w-px h-5 bg-white/15 hidden sm:block"></div>

              {/* Pindahkan ke — dropdown dark */}
              <div className="relative flex items-center">
                <ArrowLeftRight size={11} className="absolute left-2.5 text-slate-400 pointer-events-none z-10" />
                <select
                  onChange={(e) => { if (e.target.value) { handleBulkAction('MOVE', e.target.value); e.target.value = ''; } }}
                  className="appearance-none bg-slate-800/90 border border-slate-600/70 text-slate-200 text-[10px] font-bold py-1.5 pl-7 pr-3 rounded-lg outline-none cursor-pointer hover:bg-slate-700/90 hover:border-slate-500 transition-colors"
                >
                  <option value="">Pindahkan ke...</option>
                  {CLASS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="LULUS">Lulus / Alumni</option>
                </select>
              </div>

              <span className="text-[9px] text-white/30 hidden sm:inline ml-auto">Pilih santri lalu aksi — atau klik baris untuk seleksi cepat</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelasRombel;
