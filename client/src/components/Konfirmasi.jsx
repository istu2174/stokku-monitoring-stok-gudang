import Modal from './Modal.jsx';

/** Dialog konfirmasi untuk aksi penting (hapus, approve, tolak). */
export default function Konfirmasi({
  buka,
  onTutup,
  onYa,
  judul = 'Yakin lanjut?',
  pesan,
  labelYa = 'Ya, lanjut',
  labelTidak = 'Batal',
  bahaya = false,
  sedangProses = false,
}) {
  return (
    <Modal
      buka={buka}
      onTutup={onTutup}
      judul={judul}
      lebar="max-w-md"
      footer={
        <>
          <button type="button" className="btn-sekunder" onClick={onTutup} disabled={sedangProses}>
            {labelTidak}
          </button>
          <button
            type="button"
            className={bahaya ? 'btn-bahaya' : 'btn-utama'}
            onClick={onYa}
            disabled={sedangProses}
          >
            {sedangProses ? 'Memproses…' : labelYa}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-inkl">{pesan}</p>
    </Modal>
  );
}
