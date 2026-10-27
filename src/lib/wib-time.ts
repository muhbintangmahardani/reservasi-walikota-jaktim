/**
 * Utility untuk standarisasi waktu Indonesia Barat (WIB - UTC+7)
 * Memastikan timestamp di Supabase dan antarmuka pengguna konsisten dan akurat.
 */

export const getWIBISOString = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const padMs = (n: number) => String(n).padStart(3, '0');

  const d = new Date(date);
  // Hitung offset menit ke UTC, lalu tambah 7 jam (WIB)
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const wib = new Date(utcMs + 7 * 3600000);

  const y = wib.getFullYear();
  const m = pad(wib.getMonth() + 1);
  const day = pad(wib.getDate());
  const h = pad(wib.getHours());
  const min = pad(wib.getMinutes());
  const s = pad(wib.getSeconds());
  const ms = padMs(wib.getMilliseconds());

  return `${y}-${m}-${day}T${h}:${min}:${s}.${ms}+07:00`;
};

export const formatWIBDateTime = (isoString?: string | null): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
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
  } catch {
    return isoString;
  }
};
