/** Largest width and height an image may keep. Either side may be unset. */
export type FitBox = {
  maxWidth: number | null
  maxHeight: number | null
}

function positiveLimit(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}

/**
 * Size that fits inside `box`, keeping the aspect ratio. Images that already
 * fit are left unchanged (`null`), so nothing is upscaled.
 */
export function fitInsideBox(
  width: number,
  height: number,
  box: FitBox | null | undefined,
): { width: number; height: number } | null {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    !box
  ) {
    return null
  }
  const maxWidth = positiveLimit(box.maxWidth)
  const maxHeight = positiveLimit(box.maxHeight)
  if (maxWidth == null && maxHeight == null) return null
  const scale = Math.min(
    1,
    maxWidth == null ? 1 : maxWidth / width,
    maxHeight == null ? 1 : maxHeight / height,
  )
  if (scale >= 1) return null
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** A box with at least one positive side, or `null` when it does not limit. */
export function normalizeFitBox(box: FitBox | null | undefined): FitBox | null {
  if (!box) return null
  const maxWidth = positiveLimit(box.maxWidth)
  const maxHeight = positiveLimit(box.maxHeight)
  if (maxWidth == null && maxHeight == null) return null
  return { maxWidth, maxHeight }
}
