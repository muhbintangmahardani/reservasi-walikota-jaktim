/**
 * Utility untuk standarisasi waktu Indonesia Barat (WIB - UTC+7)
 * Memastikan nilai yang tersimpan di Supabase maupun yang ditampilkan di antarmuka pengguna
 * persis sesuai jam pembuatan lokal (misal: 13:45 WIB tidak berubah menjadi 06:45 UTC).
 */

export const getWIBISOString = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const p: Record<string, string> = {};
  parts.forEach(({ type, value }) => {
    p[type] = value;
  });

  const ms = String(date.getMilliseconds()).padStart(3, '0');

  // Format "YYYY-MM-DD HH:mm:ss.SSS" langsung disimpan ke Supabase
  // sehingga di Supabase Table Editor jam yang muncul persis jam lokal pembuat (misal 13:45)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${ms}`;
};

export const formatWIBDateTime = (isoString?: string | null): string => {
  if (!isoString) return '-';
  try {
    const clean = isoString.trim();
    // Parse format YYYY-MM-DD HH:mm:ss atau ISO
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, hh, mm] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIdx = parseInt(m, 10) - 1;
      return `${d} ${monthNames[monthIdx] || m} ${y}, ${hh}:${mm} WIB`;
    }

    const date = new Date(clean);
    if (!isNaN(date.getTime())) {
      return (
        new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(date) + ' WIB'
      );
    }
    return clean;
  } catch {
    return isoString;
  }
};
