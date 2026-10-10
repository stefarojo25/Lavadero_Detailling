export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizePlate(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9]/g, '')
}

function normalizePhoneDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('57')) return digits.slice(2)
  return digits
}

export function matchesClientSearch(client, query) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const searchableText = normalizeSearchText([
    client?.firstName,
    client?.lastName,
    client?.phone,
    client?.whatsapp,
    client?.address,
  ].filter(Boolean).join(' '))
  if (searchableText.includes(normalizedQuery)) return true

  const normalizedPhoneQuery = normalizePhoneDigits(query)
  if (!normalizedPhoneQuery) return false
  return [client?.phone, client?.whatsapp]
    .some((value) => normalizePhoneDigits(value).includes(normalizedPhoneQuery))
}

export function searchRank(value, normalizedValue) {
  if (value === normalizedValue) return 0
  if (value.startsWith(normalizedValue)) return 1
  return 2
}
