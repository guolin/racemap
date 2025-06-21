export function getMyRaceId(): string {
  if (typeof window === 'undefined') return '';

  const KEY = 'myRaceId';
  let id = localStorage.getItem(KEY);
  if (id && /^[0-9A-Z]{6}$/.test(id)) return id;

  // 生成 6 位 Base36 大写
  const randomNum = Math.floor(Math.random() * Math.pow(36, 6));
  id = randomNum.toString(36).toUpperCase().padStart(6, '0');
  localStorage.setItem(KEY, id);
  return id;
} 