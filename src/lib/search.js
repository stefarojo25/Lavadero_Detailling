export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchRank(value, normalizedValue) {
  if (value === normalizedValue) return 0
  if (value.startsWith(normalizedValue)) return 1
  return 2
}
