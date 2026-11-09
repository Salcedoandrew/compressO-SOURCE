import { AnimatePresence, motion } from 'framer-motion'
import { cloneDeep } from 'lodash'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'

import InfoTooltip from '@/components/InfoTooltip'
import Slider from '@/components/Slider'
import Switch from '@/components/Switch'
import ToggleSection from '@/components/ToggleSection'
import { useSyncState } from '@/hooks/useSyncState'
import {
  appProxy,
  imageConfigInitialState,
  normalizeBatchMediaConfig,
} from '@/routes/(root)/-state'
import type { ImageFormatQualities } from '@/types/app'
import { slideDownTransition } from '@/utils/animation'
import {
  getImageDynamicRangeOperation,
  isHdrJpegOutput,
  isHdrPngOutput,
} from '@/utils/imageDynamicRange'
import TargetSize from './TargetSize'

type CompressionQualityProps = {
  mediaIndex: number
}

const imageConfigInitialStateCloned = cloneDeep(imageConfigInitialState)

/** The formats Alic's default profile has a quality for, in its order */
const QUALITY_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'avif'] as const

/** A format's qualities with one of them changed, the others kept (or the defaults) */
function withFormatQuality(
  qualities: Partial<ImageFormatQualities> | undefined,
  format: keyof ImageFormatQualities,
  quality: number,
  fallback: number,
): ImageFormatQualities {
  return {
    jpeg: qualities?.jpeg ?? fallback,
    png: qualities?.png ?? fallback,
    webp: qualities?.webp ?? fallback,
    gif: qualities?.gif ?? fallback,
    avif: qualities?.avif ?? fallback,
    [format]: quality,
  }
}

/** Compresses by quality (or losslessly), or to a file size (see `TargetSize`) */
function CompressionQuality({ mediaIndex }: CompressionQualityProps) {
  const { t } = useTranslation()
  const {
    state: {
      isCompressing,
      isProcessCompleted,
      media,
      commonConfigForBatchCompression,
      isLoadingMediaFiles,
    },
  } = useSnapshot(appProxy)
  const image =
    media.length > 0 && mediaIndex >= 0 && media[mediaIndex].type == 'image'
      ? media[mediaIndex]
      : null
  const { shouldUseTargetSize } =
    image?.config ?? commonConfigForBatchCompression.imageConfig ?? {}

  const setTargetSizeMode = useCallback(
    (isTargetSize: boolean) => {
      if (
        mediaIndex >= 0 &&
        appProxy.state.media[mediaIndex].type === 'image' &&
        appProxy.state.media[mediaIndex]?.config
      ) {
        appProxy.state.media[mediaIndex].config.shouldUseTargetSize =
          isTargetSize
        appProxy.state.media[mediaIndex].isConfigDirty = true
      } else if (appProxy.state.media.length > 1) {
        appProxy.state.commonConfigForBatchCompression.imageConfig.shouldUseTargetSize =
          isTargetSize
        normalizeBatchMediaConfig()
      }
    },
    [mediaIndex],
  )

  const shouldDisableInput =
    media.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles ||
    image?.extension === 'svg'

  return (
    <ToggleSection
      aria-label={t('targetSize.mode')}
      options={[
        {
          value: 'quality',
          label: t('targetSize.modes.quality'),
          content: <QualitySettings mediaIndex={mediaIndex} />,
        },
        {
          value: 'size',
          label: t('targetSize.modes.size'),
          content: <TargetSize mediaIndex={mediaIndex} />,
        },
      ]}
      value={shouldUseTargetSize ? 'size' : 'quality'}
      onChange={(mode) => setTargetSizeMode(mode === 'size')}
      isDisabled={shouldDisableInput}
    />
  )
}

/**
 * A quality slider of one output format. The format's quality is kept apart from the others, so
 * each encoder writes at the quality chosen for it (`formatQualities`, see `ImageFormatQualities`).
 */
function FormatQualitySlider({
  mediaIndex,
  format,
  value,
  fallbackQuality,
  isDisabled,
}: {
  mediaIndex: number
  format: keyof ImageFormatQualities
  value: number
  /** Quality of formats without their own, used for the others when one is changed */
  fallbackQuality: number
  isDisabled: boolean
}) {
  const { t } = useTranslation()

  const setFormatQuality = useCallback(
    (quality: number) => {
      const { media } = appProxy.state
      const image = mediaIndex >= 0 ? media[mediaIndex] : null
      if (image?.type === 'image' && image.config) {
        image.config.formatQualities = withFormatQuality(
          image.config.formatQualities,
          format,
          quality,
          fallbackQuality,
        )
        image.isConfigDirty = true
      } else if (media.length > 1) {
        const batch = appProxy.state.commonConfigForBatchCompression.imageConfig
        batch.formatQualities = withFormatQuality(
          batch.formatQualities,
          format,
          quality,
          fallbackQuality,
        )
        normalizeBatchMediaConfig()
      }
    },
    [mediaIndex, format, fallbackQuality],
  )

  const [quality, setQuality] = useSyncState<number>({
    globalValue: value,
    setGlobalValue: setFormatQuality,
    defaultValue:
      imageConfigInitialStateCloned.formatQualities?.[format] ??
      imageConfigInitialStateCloned.quality,
    debounceMs: 500,
  })

  return (
    <Slider
      label={t(`quality.formats.${format}`)}
      aria-label={t(`quality.formats.${format}`)}
      minValue={1}
      maxValue={100}
      className="mb-3 mt-2 mx-auto"
      classNames={{ label: 'text-xs' }}
      getValue={(value) => `${value}%`}
      renderValue={() => <p className="text-primary text-xs">{quality}%</p>}
      value={quality}
      onChange={(value) => {
        if (typeof value === 'number') {
          setQuality(value)
        }
      }}
      isDisabled={isDisabled}
    />
  )
}

/** The lossless switch & the quality of each format */
function QualitySettings({ mediaIndex }: CompressionQualityProps) {
  const { t } = useTranslation()
  const {
    state: {
      isCompressing,
      isProcessCompleted,
      media,
      commonConfigForBatchCompression,
      isLoadingMediaFiles,
    },
  } = useSnapshot(appProxy)
  const image =
    media.length > 0 && mediaIndex >= 0 && media[mediaIndex].type == 'image'
      ? media[mediaIndex]
      : null
  const { config } = image ?? {}
  const settings = config ?? commonConfigForBatchCompression.imageConfig
  const { isLossless: requestedLossless } = settings
  const images = image ? [image] : media.filter((item) => item.type === 'image')
  const hdrPng =
    images.length > 0 &&
    images.every((item) =>
      isHdrPngOutput(
        settings.convertToExtension === '-'
          ? (item.extension ?? '')
          : settings.convertToExtension,
        getImageDynamicRangeOperation(
          settings.dynamicRange,
          item.dynamicRangeInfo,
          settings.convertToExtension === '-'
            ? (item.extension ?? '')
            : settings.convertToExtension,
        ),
        item.dynamicRangeInfo,
      ),
    )
  const hdrJpeg = images.some((item) =>
    isHdrJpegOutput(
      settings.convertToExtension === '-'
        ? (item.extension ?? '')
        : settings.convertToExtension,
      getImageDynamicRangeOperation(
        settings.dynamicRange,
        item.dynamicRangeInfo,
        settings.convertToExtension === '-'
          ? (item.extension ?? '')
          : settings.convertToExtension,
      ),
      item.dynamicRangeInfo,
    ),
  )
  const isLossless = (requestedLossless && !hdrJpeg) || hdrPng

  const handleSwitchToggle = useCallback(() => {
    if (
      mediaIndex >= 0 &&
      appProxy.state.media[mediaIndex].type === 'image' &&
      appProxy.state.media[mediaIndex]?.config
    ) {
      appProxy.state.media[mediaIndex].config.isLossless =
        !appProxy.state.media[mediaIndex].config.isLossless
      appProxy.state.media[mediaIndex].isConfigDirty = true
    } else {
      if (appProxy.state.media.length > 1) {
        appProxy.state.commonConfigForBatchCompression.imageConfig.isLossless =
          !appProxy.state.commonConfigForBatchCompression.imageConfig.isLossless
        normalizeBatchMediaConfig()
      }
    }
  }, [mediaIndex])

  const shouldDisableInput =
    media.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles ||
    image?.extension === 'svg'

  return (
    <>
      <div className="flex items-center">
        <Switch
          isSelected={isLossless}
          onValueChange={handleSwitchToggle}
          isDisabled={shouldDisableInput || hdrPng || hdrJpeg}
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm mr-2 w-full">
            {t('quality.lossless')}
          </p>
        </Switch>
        <InfoTooltip content={hdrJpeg ? t('dynamicRange.jpegLossy') : null} />
      </div>
      <AnimatePresence mode="wait">
        {!isLossless ? (
          <motion.div {...slideDownTransition}>
            {QUALITY_FORMATS.map((format) => (
              <FormatQualitySlider
                key={format}
                mediaIndex={mediaIndex}
                format={format}
                value={settings.formatQualities?.[format] ?? settings.quality}
                fallbackQuality={settings.quality}
                isDisabled={shouldDisableInput}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default CompressionQuality
