export function UzbekDate(): string {
    const date = new Date();
  
    // Tashkent UTC+5 -> 5 soat offset
    const tashkentOffsetMs = 5 * 60 * 60 * 1000;
    const tashkentDate = new Date(date.getTime() + tashkentOffsetMs);
  
    // ISO 8601 format: '2025-04-14T05:27:30.000+05:00'
    // Ammo JavaScript Date() toISOString() doim UTC bo‘ladi: '2025-04-14T00:27:30.000Z'
    // Shuning uchun offsetli formatni qo‘lda quramiz
  
    const year = tashkentDate.getFullYear();
    const month = String(tashkentDate.getMonth() + 1).padStart(2, '0');
    const day = String(tashkentDate.getDate()).padStart(2, '0');
    const hours = String(tashkentDate.getHours()).padStart(2, '0');
    const minutes = String(tashkentDate.getMinutes()).padStart(2, '0');
    const seconds = String(tashkentDate.getSeconds()).padStart(2, '0');
  
    // +05:00 offset bilan ISO format
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:00`;
  }
  
