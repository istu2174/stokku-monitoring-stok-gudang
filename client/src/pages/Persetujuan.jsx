import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { angka, tanggal, TIPE_TRANSAKSI } from '../lib/format.js';
import { BadgeTransaksi, EmptyState, JudulHalaman, KerangkaBaris } from '../components/Ui.jsx';
import Modal from '../components/Modal.jsx';
import Konfirmasi from '../components/Konfirmasi.jsx';

/** Antrean persetujuan barang keluar & stock opname. */
export default function Persetujuan() {
  const { boleh } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [setuju, setSetuju] = useState(null);
  const [tolak, setTolak] = useState(null);
  const [catatanTolak, setCatatanTolak] = useState('');
  const [sedangProses, setSedangProses] = useState(false);

  async function muat() {
    setMemuat(true);
    try {
      const data = await api.get('/transaksi/menunggu');
      setItems(data.items);
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bolehSetujui(tipe) {
    return tipe === 'KELUAR' ? boleh('approveKeluar') : tipe === 'PENYESUAIAN' ? boleh('opnameApprove') : false;
  }

  async function kirimApprove() {
    setSedangProses(true);
    try {
      await api.put(`/transaksi/${setuju.id}/approve`);
      toast.sukses('Disetujui. Stok sudah diperbarui.');
      setSetuju(null);
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangProses(false);
    }
  }

  async function kirimTolak() {
    if (!catatanTolak.trim()) {
      toast.gagal('Alasan penolakan wajib diisi.');
      return;
    }
    setSedangProses(true);
    try {
      await api.put(`/transaksi/${tolak.id}/tolak`, { catatanTolak: catatanTolak.trim() });
      toast.sukses('Transaksi ditolak.');
      setTolak(null);
      setCatatanTolak('');
      muat();
    } catch (err) {
      toast.gagal(err.message);
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Persetujuan"
        keterangan="Pengajuan barang keluar dan penyesuaian stok yang menunggu keputusan."
      />

      {memuat ? (
        <div className="kartu">
          <KerangkaBaris jumlah={4} />
        </div>
      ) : items.length === 0 ? (
        <div className="kartu">
          <EmptyState ikon="🎉" judul="Tidak ada yang menunggu" pesan="Semua pengajuan sudah diproses." />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => {
            const meta = TIPE_TRANSAKSI[t.tipe] || TIPE_TRANSAKSI.KELUAR;
            const bisa = bolehSetujui(t.tipe);
            return (
              <div key={t.id} className="kartu overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${meta.kelas}`}>
                      {meta.ikon}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {meta.label} · {t.noDokumen || '-'}
                      </p>
                      <p className="text-xs text-inkl">
                        {tanggal(t.tanggal)} · diajukan {t.dibuatOleh?.nama || '-'}
                      </p>
                      {(t.tujuan || t.alasan) && (
                        <p className="mt-1 text-sm text-slate-600">{t.tujuan || t.alasan}</p>
                      )}
                    </div>
                  </div>
                  <BadgeTransaksi status={t.status} />
                </div>

                <ul className="divide-y divide-slate-100">
                  {t.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{it.barang?.nama}</span>
                        <span className="text-xs text-inkl">
                          {t.tipe === 'PENYESUAIAN'
                            ? `sistem ${angka(it.stokSistem)} → fisik ${angka(it.stokFisik)}`
                            : it.barang?.sku}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold">
                        {t.tipe === 'PENYESUAIAN' && it.qty > 0 ? '+' : ''}
                        {angka(it.qty)} <span className="text-xs font-normal text-inkl">{it.barang?.satuan}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 p-3">
                  {bisa ? (
                    <>
                      <button
                        type="button"
                        className="btn-bahaya btn-kecil"
                        onClick={() => {
                          setTolak(t);
                          setCatatanTolak('');
                        }}
                      >
                        Tolak
                      </button>
                      <button type="button" className="btn-utama btn-kecil" onClick={() => setSetuju(t)}>
                        Setujui
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-inkl">
                      Role kamu bisa melihat antrean ini, tapi persetujuannya dilakukan Kepala/Manajer.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Konfirmasi
        buka={Boolean(setuju)}
        onTutup={() => setSetuju(null)}
        onYa={kirimApprove}
        judul="Setujui pengajuan ini?"
        pesan={
          setuju
            ? setuju.tipe === 'KELUAR'
              ? `Stok ${setuju.items.length} barang akan langsung dikurangi sesuai FEFO (expired terdekat keluar dulu).`
              : `Stok ${setuju.items.length} barang akan disesuaikan dengan hasil hitung fisik.`
            : ''
        }
        labelYa="Ya, setujui"
        sedangProses={sedangProses}
      />

      <Modal
        buka={Boolean(tolak)}
        onTutup={() => setTolak(null)}
        judul="Tolak pengajuan"
        subjudul="Alasan penolakan akan terlihat oleh pengaju."
        lebar="max-w-md"
        footer={
          <>
            <button type="button" className="btn-sekunder" onClick={() => setTolak(null)}>
              Batal
            </button>
            <button type="button" className="btn-bahaya" onClick={kirimTolak} disabled={sedangProses}>
              {sedangProses ? 'Memproses…' : 'Ya, tolak'}
            </button>
          </>
        }
      >
        <label className="label" htmlFor="alasan-tolak">
          Alasan penolakan *
        </label>
        <textarea
          id="alasan-tolak"
          className="input min-h-[100px]"
          value={catatanTolak}
          onChange={(e) => setCatatanTolak(e.target.value)}
          placeholder="misal: qty tidak sesuai permintaan bagian produksi"
        />
      </Modal>
    </div>
  );
}
