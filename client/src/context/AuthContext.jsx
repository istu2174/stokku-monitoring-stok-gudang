import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

/** Menyimpan user yang login + daftar izinnya (dipakai untuk menu & route guard). */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [izin, setIzin] = useState([]);
  const [memuat, setMemuat] = useState(true);

  const muatSesi = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setIzin(data.izin || []);
    } catch {
      setUser(null);
      setIzin([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muatSesi();
  }, [muatSesi]);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    setUser(data.user);
    setIzin(data.izin || []);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* tetap bersihkan sesi lokal */
    }
    setUser(null);
    setIzin([]);
  }, []);

  const nilai = useMemo(
    () => ({
      user,
      izin,
      memuat,
      login,
      logout,
      muatSesi,
      /** Cek satu izin, misal boleh('kelolaBarang') */
      boleh: (kunci) => izin.includes(kunci),
      /** Cek salah satu izin terpenuhi */
      bolehSalahSatu: (...kunci) => kunci.some((k) => izin.includes(k)),
    }),
    [user, izin, memuat, login, logout, muatSesi],
  );

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
