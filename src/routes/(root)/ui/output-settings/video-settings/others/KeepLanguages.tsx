import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'

import TextInput from '@/components/TextInput'
import { appProxy, normalizeBatchMediaConfig } from '@/routes/(root)/-state'
import { sanitizeLanguageList } from '@/utils/trackLanguages'
import { useBatchVideoConfigKey } from '../-batchConfig'

type KeepLanguagesProps = {
  mediaIndex: number
}

/** Optional audio and subtitle language filter for one video or a whole batch. */
function KeepLanguages({ mediaIndex }: KeepLanguagesProps) {
  const { t } = useTranslation()
  const batchConfigKey = useBatchVideoConfigKey()
  const {
    state: {
      isCompressing,
      isProcessCompleted,
      media,
      commonConfigForBatchCompression,
      isLoadingMediaFiles,
    },
  } = useSnapshot(appProxy)
  const video =
    media.length > 0 && mediaIndex >= 0 && media[mediaIndex].type === 'video'
      ? media[mediaIndex]
      : null
  const config =
    video?.config ?? commonConfigForBatchCompression[batchConfigKey]
  const disabled =
    media.length === 0 ||
    isCompressing ||
    isProcessCompleted ||
    isLoadingMediaFiles

  const setLanguages = (
    field: 'keepAudioLanguages' | 'keepSubtitleLanguages',
    value: string,
  ) => {
    const next = sanitizeLanguageList(value)
    if (mediaIndex >= 0 && appProxy.state.media[mediaIndex].type === 'video') {
      appProxy.state.media[mediaIndex].config[field] = next
      appProxy.state.media[mediaIndex].isConfigDirty = true
      return
    }
    if (appProxy.state.media.length > 1) {
      appProxy.state.commonConfigForBatchCompression[batchConfigKey][field] =
        next
      normalizeBatchMediaConfig()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('outputSettings.languages.title')}
        </p>
        <p className="text-xs text-gray-500">
          {t('outputSettings.languages.description')}
        </p>
      </div>
      <TextInput
        aria-label={t('outputSettings.languages.audio')}
        label={t('outputSettings.languages.audio')}
        placeholder={t('outputSettings.languages.placeholder')}
        value={config?.keepAudioLanguages ?? ''}
        isDisabled={disabled}
        onValueChange={(value) => setLanguages('keepAudioLanguages', value)}
      />
      <TextInput
        aria-label={t('outputSettings.languages.subtitles')}
        label={t('outputSettings.languages.subtitles')}
        placeholder={t('outputSettings.languages.placeholder')}
        value={config?.keepSubtitleLanguages ?? ''}
        isDisabled={disabled}
        onValueChange={(value) => setLanguages('keepSubtitleLanguages', value)}
      />
    </div>
  )
}

export default KeepLanguages
