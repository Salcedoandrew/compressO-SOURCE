const LANGUAGE_CODE = /^[a-z0-9-]{2,16}$/i

/** Comma- or space-separated language codes, lowercased, with anything else dropped. */
export function parseLanguageList(value: string | null | undefined): string[] {
  if (!value) return []
  const codes = value
    .split(/[\s,]+/)
    .map((code) => code.trim().toLowerCase())
    .filter((code) => LANGUAGE_CODE.test(code))
  const unique: string[] = []
  for (const code of codes) {
    if (!unique.includes(code)) unique.push(code)
  }
  return unique
}

/** Keeps only letters, commas, spaces and hyphens, and limits the length. */
export function sanitizeLanguageList(value: string) {
  return value.replace(/[^A-Za-z0-9,\s-]/g, '').slice(0, 64)
}

/**
 * Indexes of tracks whose language is in `keep`. An empty `keep` does not
 * filter. Unknown languages are dropped when a list is set.
 */
export function matchingTrackIndexes(
  languages: readonly (string | null | undefined)[],
  keep: readonly string[],
): number[] {
  if (keep.length === 0) return languages.map((_, index) => index)
  const wanted = new Set(keep.map((code) => code.toLowerCase()))
  return languages.flatMap((language, index) =>
    language && wanted.has(language.toLowerCase()) ? [index] : [],
  )
}
