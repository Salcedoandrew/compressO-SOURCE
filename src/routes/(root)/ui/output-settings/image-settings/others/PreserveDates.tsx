import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'

import InfoTooltip from '@/components/InfoTooltip'
import Switch from '@/components/Switch'
import { appProxy, normalizeBatchMediaConfig } from '@/routes/(root)/-state'

/** Keeps the image's creation & modification dates on the compressed output */
function PreserveDates({ mediaIndex }: { mediaIndex: number }) {
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
  // Settings saved before this option existed kept the dates (as Alic's default does)
  const shouldPreserveDates = settings.shouldPreserveDates !== false

  const handleToggle = useCallback(() => {
    const value = !shouldPreserveDates
    if (
      mediaIndex >= 0 &&
      appProxy.state.media[mediaIndex].type === 'image' &&
      appProxy.state.media[mediaIndex]?.config
    ) {
      appProxy.state.media[mediaIndex].config.shouldPreserveDates = value
      appProxy.state.media[mediaIndex].isConfigDirty = true
    } else if (appProxy.state.media.length > 1) {
      appProxy.state.commonConfigForBatchCompression.imageConfig.shouldPreserveDates =
        value
      normalizeBatchMediaConfig()
    }
  }, [mediaIndex, shouldPreserveDates])

  const shouldDisableInput =
    media.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles

  return (
    <div className="flex items-center">
      <Switch
        isSelected={shouldPreserveDates}
        onValueChange={handleToggle}
        isDisabled={shouldDisableInput}
      >
        <p className="text-gray-600 dark:text-gray-400 text-sm mr-2 w-full">
          {t('preserveDates.title')}
        </p>
      </Switch>
      <InfoTooltip content={t('preserveDates.description')} />
    </div>
  )
}

export default PreserveDates
