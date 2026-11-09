import type { ImagePreset } from '@/types/preset'

const svgConfig = {
  filterSpeckle: 4,
  colorPrecision: 6,
  layerDifference: 16,
  cornerThreshold: 60,
  lengthThreshold: 4,
  spliceThreshold: 45,
  isBw: false,
}

/** Built-in wedding/client JPEG preset. Seeded once; deleting it stays deleted. */
export const PHOTO_DELIVERY_PRESET_ID = 'photo-delivery'

/** Long edge inside the range a client gallery usually wants (2048–3000). */
export const PHOTO_DELIVERY_LONG_EDGE = 2560

export const PHOTO_DELIVERY_QUALITY = 90

export const PHOTO_DELIVERY_PRESET_NAME = 'Photo delivery'

export function createPhotoDeliveryPreset(): ImagePreset {
  return {
    id: PHOTO_DELIVERY_PRESET_ID,
    name: PHOTO_DELIVERY_PRESET_NAME,
    mediaType: 'image',
    settings: {
      dynamicRange: { mode: 'original', intensity: 2 },
      convertToExtension: 'jpg',
      isLossless: false,
      quality: PHOTO_DELIVERY_QUALITY,
      shouldUseTargetSize: false,
      targetSizeInKB: 500,
      shouldStripMetadata: false,
      svgScaleFactor: 1,
      shouldEnableAdvancedSvgSetting: false,
      svgConfig,
      resolution: null,
      transform: null,
      fitBox: {
        maxWidth: PHOTO_DELIVERY_LONG_EDGE,
        maxHeight: PHOTO_DELIVERY_LONG_EDGE,
      },
    },
  }
}
