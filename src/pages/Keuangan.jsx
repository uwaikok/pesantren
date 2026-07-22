import React, { useState, useEffect } from 'react';
import { DollarSign, Printer, CheckCircle, XCircle, RotateCcw, Calendar } from 'lucide-react';
import api from '../utils/api';

function Keuangan({ user }) {
  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [currentSantriDetails, setCurrentSantriDetails] = useState(null);
  
  const [keuanganData, setKeuanganData] = useState(null);
  const [sppTahun, setSppTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // State untuk cetak kwitansi tunggal
  const [printingInvoice, setPrintingInvoice] = useState(null);
  // State untuk tipe cetak: 'RECIP' (Kwitansi Tunggal) atau 'RECAP' (Laporan Rekap Setahun)
  const [printType, setPrintType] = useState('RECAP');

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
      fetchKeuanganData();
    }
  }, [selectedSantriId, sppTahun]);

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

  const fetchKeuanganData = async () => {
    setLoading(true);
    try {
      const url = user.role === 'ADMIN'
        ? `/keuangan/santri/${selectedSantriId}`
        : '/keuangan/my';

      const response = await api.get(url, {
        params: { tahun: sppTahun }
      });
      setKeuanganData(response);

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

  const handleUpdateSppStatus = async (bulan, currentStatus) => {
    const nextStatus = currentStatus === 'LUNAS' ? 'BELUM_BAYAR' : 'LUNAS';
    
    // Konfirmasi
    const msg = nextStatus === 'LUNAS'
      ? `Catat iuran syariah bulan ${getNamaBulan(bulan)} ${sppTahun} sebagai LUNAS?`
      : `Batalkan status Lunas syariah bulan ${getNamaBulan(bulan)} ${sppTahun} menjadi BELUM BAYAR?`;
      
    if (!window.confirm(msg)) return;

    try {
      await api.post('/keuangan', {
        santriId: parseInt(selectedSantriId),
        bulan,
        tahun: parseInt(sppTahun),
        status: nextStatus,
        jumlah: 250000 // Tarif Syariah Bulanan
      });
      fetchKeuanganData();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status syariah');
    }
  };

  // Fungsi Cetak Kwitansi Tunggal
  const handlePrintReceipt = (sppItem) => {
    setPrintType('RECIP');
    setPrintingInvoice({
      ...sppItem,
      noInvoice: `INV/SYR/${sppTahun}/${sppItem.bulan.toString().padStart(2, '0')}/PP-${selectedSantriId}`
    });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Fungsi Cetak Laporan Rekap Bulanan
  const handlePrintRecap = () => {
    setPrintType('RECAP');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getNamaBulan = (num) => {
    const listBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return listBulan[num - 1];
  };

  // Terbilang helper untuk rupiah
  const getTerbilang = (amount) => {
    if (amount === 250000) return 'Dua Ratus Lima Puluh Ribu Rupiah';
    return 'Dua Ratus Lima Puluh Ribu Rupiah'; // Standard SPP
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR KEUANGAN (no-print) */}
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

          {/* Tahun Buku Syariah */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun Buku Syariah</label>
            <select
              value={sppTahun}
              onChange={(e) => setSppTahun(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        <button
          onClick={handlePrintRecap}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition self-start md:self-center"
        >
          <Printer size={16} />
          <span>Laporan Rekap Syariah</span>
        </button>
      </div>

      {/* KARTU RINGKASAN SALDO (no-print) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sudah Dibayarkan ({sppTahun})</span>
            <h3 className="text-2xl font-extrabold mt-1 text-emerald-800">
              Rp {keuanganData?.totalTerbayar.toLocaleString('id-ID') || 0}
            </h3>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <CheckCircle size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akumulasi Tunggakan ({sppTahun})</span>
            <h3 className={`text-2xl font-extrabold mt-1 ${keuanganData?.totalTunggakan > 0 ? 'text-rose-600' : 'text-emerald-800'}`}>
              Rp {keuanganData?.totalTunggakan.toLocaleString('id-ID') || 0}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl ${keuanganData?.totalTunggakan > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-750'}`}>
            <XCircle size={28} />
          </div>
        </div>
      </div>

      {/* GRID 12 BULAN PEMBAYARAN (no-print) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
        <h2 className="text-base font-bold text-slate-800 font-serif mb-6 flex items-center space-x-2">
          <DollarSign className="text-emerald-600" size={20} />
          <span>Status Iuran Pembayaran Syariah Bulanan - {currentSantriDetails?.nama}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {keuanganData?.payments.map((p) => {
              const isPaid = p.status === 'LUNAS';
              return (
                <div 
                  key={p.bulan} 
                  className={`border rounded-2xl p-4 flex flex-col justify-between h-40 transition-all ${
                    isPaid 
                      ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SYARIAH BULANAN</span>
                      <h4 className="font-bold text-sm text-slate-800">{getNamaBulan(p.bulan)}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">Rp {p.jumlah.toLocaleString('id-ID')}</p>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isPaid 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                        : 'bg-rose-100 text-rose-800 border border-rose-250'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    {/* Aksi Bayar (Admin Only) */}
                    {user.role === 'ADMIN' ? (
                      <button
                        onClick={() => handleUpdateSppStatus(p.bulan, p.status)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10px] transition text-center flex items-center justify-center space-x-1 ${
                          isPaid
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/10'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <RotateCcw size={10} />
                            <span>Batal Bayar</span>
                          </>
                        ) : (
                          <span>Tandai Lunas</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {isPaid 
                          ? `Bayar: ${new Date(p.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` 
                          : 'Belum Lunas'}
                      </span>
                    )}

                    {/* Tombol Cetak Kwitansi */}
                    {isPaid && (
                      <button
                        onClick={() => handlePrintReceipt(p)}
                        title="Cetak Kwitansi Bukti Bayar"
                        className="p-1.5 border border-slate-250 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                      >
                        <Printer size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- BAGIAN CETAK: 1. KWITANSI TUNGGAL (TAMPIL HANYA SAAT PRINT) --- */}
      {printType === 'RECIP' && printingInvoice && (
        <div className="hidden print:block print-area bg-white p-6 font-serif max-w-2xl mx-auto border-2 border-slate-800 rounded-xl relative shadow-md">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
            <img src="/logo.png" className="w-44 h-44 object-contain" alt="Logo" />
          </div>

          <div className="flex justify-between items-start border-b border-slate-400 pb-3 mb-4">
            <div>
              <h2 className="text-base font-extrabold uppercase text-emerald-950 font-serif">PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI</h2>
              <p className="text-[9px] text-slate-500 font-sans mt-0.5">
                Jl. Raya Pesantren No. 1, Sumberpasir, Pakis, Malang • Telp: (0341) 789012
              </p>
            </div>
            <div className="text-right">
              <span className="bg-emerald-900/10 text-emerald-900 border border-emerald-900/20 text-[9px] font-bold px-2 py-0.5 rounded font-sans uppercase">
                Bukti Pembayaran Resmi
              </span>
              <p className="text-[10px] font-mono text-slate-600 mt-1">{printingInvoice.noInvoice}</p>
            </div>
          </div>

          <h3 className="text-center text-sm font-bold underline uppercase tracking-wider mb-4 font-serif">
            KWITANSI / TANDA TERIMA PEMBAYARAN
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex border-b border-slate-100 pb-1.5">
              <span className="w-40 text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="w-4">:</span>
              <span className="flex-1 font-bold text-slate-800">
                {currentSantriDetails?.namaWali || 'Orang Tua / Wali'} ({currentSantriDetails?.nama})
              </span>
            </div>

            <div className="flex border-b border-slate-100 pb-1.5">
              <span className="w-40 text-slate-500 font-medium">Uang Sejumlah</span>
              <span className="w-4">:</span>
              <span className="flex-1 font-bold text-emerald-800 text-sm">
                Rp {printingInvoice.jumlah.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex border-b border-slate-100 pb-1.5">
              <span className="w-40 text-slate-500 font-medium">Terbilang</span>
              <span className="w-4">:</span>
              <span className="flex-1 italic bg-slate-50 px-2 py-0.5 rounded text-slate-650 font-medium border border-slate-200/50">
                "{getTerbilang(printingInvoice.jumlah)}"
              </span>
            </div>

            <div className="flex border-b border-slate-100 pb-1.5">
              <span className="w-40 text-slate-500 font-medium">Untuk Pembayaran</span>
              <span className="w-4">:</span>
              <span className="flex-1 font-medium text-slate-700">
                Syariah Bulanan - Bulan <strong className="text-emerald-800">{getNamaBulan(printingInvoice.bulan)}</strong> Tahun <strong className="text-emerald-800">{printingInvoice.tahun}</strong>
              </span>
            </div>

            <div className="flex border-b border-slate-100 pb-1.5">
              <span className="w-40 text-slate-500 font-medium">Kelas / ID Santri</span>
              <span className="w-4">:</span>
              <span className="flex-1 text-slate-700">
                {currentSantriDetails?.kelas || '-'} / PP-{selectedSantriId.toString().padStart(4, '0')}
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center text-xs">
            <div className="border-2 border-dashed border-emerald-700 bg-emerald-50 px-4 py-2 text-center rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Status Transaksi</span>
              <h4 className="text-base font-extrabold text-emerald-700 mt-0.5">LUNAS</h4>
            </div>
            
            <div className="text-center font-sans">
              <p className="text-slate-500">Malang, {new Date(printingInvoice.tanggalBayar).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-bold text-slate-800 mt-1">Bendahara Pondok Pesantren</p>
              <div className="h-12"></div>
              <p className="underline font-bold text-slate-800 font-serif">Ustadz Pembina Bendahara</p>
              <p className="text-[9px] text-slate-400">SIM Miftahul Huda As-Syadzili Auto-Generated</p>
            </div>
          </div>
        </div>
      )}

      {/* --- BAGIAN CETAK: 2. LAPORAN REKAP BULANAN SETAHUN (TAMPIL HANYA SAAT PRINT) --- */}
      {printType === 'RECAP' && (
        <div className="hidden print:block print-area bg-white p-8 font-serif leading-relaxed text-sm">
          <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wider">YAYASAN MIFTAHUL HUDA AS-SYADZILI</h1>
            <h2 className="text-2xl font-extrabold uppercase font-serif text-emerald-950 mt-1">PONDOK PESANTREN MIFTAHUL HUDA AS-SYADZILI</h2>
            <p className="text-[10px] text-slate-500 font-sans mt-1">
              Jl. Raya Pesantren No. 1, Sumberpasir, Pakis, Malang • Telp: (0341) 789012
            </p>
          </div>

          <h3 className="text-center text-base font-bold underline uppercase tracking-wider mb-6">
            LAPORAN REKAP PEMBAYARAN SYARIAH BULANAN TAHUN {sppTahun}
          </h3>

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
                    <td className="font-bold text-slate-500 py-1">Kelas Santri</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{currentSantriDetails?.kelas || 'Belum Ditentukan'}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-500 py-1">ID Santri</td>
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
                    <td className="w-32 font-bold text-slate-500 py-1">Tahun Rekap Buku</td>
                    <td className="w-4 py-1">:</td>
                    <td className="py-1 font-bold">{sppTahun}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-500 py-1">Total Terbayar</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-bold text-emerald-800">Rp {keuanganData?.totalTerbayar.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-500 py-1">Total Tunggakan</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-bold text-rose-600">Rp {keuanganData?.totalTunggakan.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-900 text-xs mb-8">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 py-2.5 px-3 text-center w-12">Bulan</th>
                <th className="border border-slate-900 py-2.5 px-3 text-left">Deskripsi Pembayaran</th>
                <th className="border border-slate-900 py-2.5 px-3 text-center w-32">Nominal Iuran</th>
                <th className="border border-slate-900 py-2.5 px-3 text-center w-36">Tanggal Bayar</th>
                <th className="border border-slate-900 py-2.5 px-3 text-center w-32">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {keuanganData?.payments.map((p) => {
                const isPaid = p.status === 'LUNAS';
                return (
                  <tr key={p.bulan}>
                    <td className="border border-slate-900 py-2 px-3 text-center font-bold">{p.bulan}</td>
                    <td className="border border-slate-900 py-2 px-3">Syariah Bulanan Bulan {getNamaBulan(p.bulan)} {p.tahun}</td>
                    <td className="border border-slate-900 py-2 px-3 text-center">Rp {p.jumlah.toLocaleString('id-ID')}</td>
                    <td className="border border-slate-900 py-2 px-3 text-center text-slate-600">
                      {isPaid ? new Date(p.tanggalBayar).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </td>
                    <td className="border border-slate-900 py-2 px-3 text-center font-bold">
                      <span className={isPaid ? 'text-emerald-700' : 'text-rose-600'}>
                        {isPaid ? '✓ LUNAS' : '✗ BELUM BAYAR'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="grid grid-cols-2 text-center text-xs mt-12">
            <div>
              <p>Mengesahkan,</p>
              <p className="font-bold">Kepala Pengasuh Pesantren</p>
              <div className="h-16"></div>
              <p className="underline font-bold">RIFKI AHMAD DZULFIKRI</p>
            </div>
            <div>
              <p>Dibuat Oleh,</p>
              <p className="font-bold">Bendahara Pondok Pesantren</p>
              <div className="h-16"></div>
              <p className="underline font-bold">Ustadz Pembina Bendahara</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Keuangan;
