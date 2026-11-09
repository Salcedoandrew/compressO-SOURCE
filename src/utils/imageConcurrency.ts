/** How many images may be compressed at once. Videos stay one at a time. */
export const IMAGE_CONCURRENCY_RANGE = { min: 1, max: 8 } as const

/** Two images at once: faster photo batches, without crowding a video encode. */
export const DEFAULT_IMAGE_CONCURRENCY = 2

export function clampImageConcurrency(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_IMAGE_CONCURRENCY
  return Math.min(
    IMAGE_CONCURRENCY_RANGE.max,
    Math.max(IMAGE_CONCURRENCY_RANGE.min, Math.round(parsed)),
  )
}
