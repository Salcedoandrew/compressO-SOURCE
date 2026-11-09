import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'

import ColorPicker from '@/components/ColorPicker'
import InfoTooltip from '@/components/InfoTooltip'
import Switch from '@/components/Switch'
import {
  appProxy,
  imageConfigInitialState,
  normalizeBatchMediaConfig,
} from '@/routes/(root)/-state'

/** The color the picker opens with (black, as Alic's background fill) */
const DEFAULT_COLOR = imageConfigInitialState.backgroundColor ?? '#000000'

/** `#RRGGBB` as the `r g b` string the color picker uses */
function hexToRgbString(hex: string) {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((part) => part + part)
          .join('')
      : value
  const [r, g, b] = [0, 2, 4].map(
    (index) => Number.parseInt(full.slice(index, index + 2), 16) || 0,
  )
  return `${r} ${g} ${b}`
}

/** The `r g b` string the color picker gives as `#RRGGBB` */
function rgbStringToHex(rgb: string) {
  const [r, g, b] = rgb.split(' ').map(Number)
  return `#${[r, g, b]
    .map((value) =>
      Math.max(0, Math.min(255, value || 0))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** Fills transparent areas when converting to a format without alpha (e.g. JPEG) */
function BackgroundFill({ mediaIndex }: { mediaIndex: number }) {
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
    media.length > 0 && mediaIndex >= 0 && media[mediaIndex].type === 'image'
      ? media[mediaIndex]
      : null
  const settings = image?.config ?? commonConfigForBatchCompression.imageConfig
  const { shouldFillBackground, backgroundColor } = settings
  const color = backgroundColor ?? DEFAULT_COLOR

  const update = useCallback(
    (values: { shouldFillBackground?: boolean; backgroundColor?: string }) => {
      if (
        mediaIndex >= 0 &&
        appProxy.state.media[mediaIndex].type === 'image' &&
        appProxy.state.media[mediaIndex]?.config
      ) {
        Object.assign(appProxy.state.media[mediaIndex].config, values)
        appProxy.state.media[mediaIndex].isConfigDirty = true
      } else if (appProxy.state.media.length > 1) {
        Object.assign(
          appProxy.state.commonConfigForBatchCompression.imageConfig,
          values,
        )
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
    <>
      <div className="flex items-center">
        <Switch
          isSelected={!!shouldFillBackground}
          onValueChange={() =>
            update({ shouldFillBackground: !shouldFillBackground })
          }
          isDisabled={shouldDisableInput}
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm mr-2 w-full">
            {t('backgroundFill.title')}
          </p>
        </Switch>
        <InfoTooltip content={t('backgroundFill.description')} />
      </div>
      {shouldFillBackground ? (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            {t('backgroundFill.color')}
          </span>
          <ColorPicker
            color={hexToRgbString(color)}
            defaultColor="0 0 0"
            onChange={(rgb) => update({ backgroundColor: rgbStringToHex(rgb) })}
          />
        </div>
      ) : null}
    </>
  )
}

export default BackgroundFill
