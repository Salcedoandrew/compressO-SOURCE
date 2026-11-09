import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'

import NumberInput from '@/components/NumberInput'
import { appProxy, normalizeBatchMediaConfig } from '@/routes/(root)/-state'
import type { FitBox as FitBoxValue } from '@/utils/fitBox'
import { normalizeFitBox } from '@/utils/fitBox'

type FitBoxProps = {
  mediaIndex: number
}

function limitFromInput(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

/** Largest width and height. Images that already fit are not enlarged. */
function FitBox({ mediaIndex }: FitBoxProps) {
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
  const fitBox =
    image?.config.fitBox ??
    commonConfigForBatchCompression.imageConfig.fitBox ??
    null
  const disabled =
    media.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles ||
    image?.extension === 'svg'

  const setFitBox = (next: FitBoxValue) => {
    const box = normalizeFitBox(next)
    if (mediaIndex >= 0 && appProxy.state.media[mediaIndex].type === 'image') {
      appProxy.state.media[mediaIndex].config.fitBox = box
      appProxy.state.media[mediaIndex].isConfigDirty = true
      return
    }
    if (appProxy.state.media.length > 1) {
      appProxy.state.commonConfigForBatchCompression.imageConfig.fitBox = box
      normalizeBatchMediaConfig()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('outputSettings.fitBox.title')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {t('outputSettings.fitBox.description')}
        </p>
      </div>
      <div className="flex gap-2">
        <NumberInput
          aria-label={t('outputSettings.fitBox.width')}
          label={t('outputSettings.fitBox.width')}
          minValue={0}
          step={1}
          value={fitBox?.maxWidth ?? undefined}
          isDisabled={disabled}
          onValueChange={(value) =>
            setFitBox({
              maxWidth: limitFromInput(value),
              maxHeight: fitBox?.maxHeight ?? null,
            })
          }
          className="flex-1"
        />
        <NumberInput
          aria-label={t('outputSettings.fitBox.height')}
          label={t('outputSettings.fitBox.height')}
          minValue={0}
          step={1}
          value={fitBox?.maxHeight ?? undefined}
          isDisabled={disabled}
          onValueChange={(value) =>
            setFitBox({
              maxWidth: fitBox?.maxWidth ?? null,
              maxHeight: limitFromInput(value),
            })
          }
          className="flex-1"
        />
      </div>
    </div>
  )
}

export default FitBox
