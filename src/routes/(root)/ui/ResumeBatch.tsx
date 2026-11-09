import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@/components/Button'
import { toast } from '@/components/Toast'
import { applyPreset } from '@/routes/(root)/-presets'
import { appProxy } from '@/routes/(root)/-state'
import {
  clearStoredBatchSession,
  readStoredBatchSession,
  unfinishedBatchItems,
} from '@/utils/batchSession'
import { addMedia } from '../-media'

/** Offers to open files that were not saved before the app quit or crashed. */
function ResumeBatch() {
  const { t } = useTranslation()
  const [items, setItems] = useState(() =>
    unfinishedBatchItems(readStoredBatchSession()),
  )
  const [isResuming, setIsResuming] = useState(false)
  if (items.length === 0) return null

  const resume = async () => {
    setIsResuming(true)
    try {
      await addMedia(
        items.map((item) => ({
          path: item.path,
          relativeDir: item.relativeDir,
        })),
      )
      for (const [index, mediaFile] of appProxy.state.media.entries()) {
        const item = items.find((entry) => entry.path === mediaFile.pathRaw)
        if (!item?.presetId) continue
        const mediaType =
          mediaFile.type === 'image'
            ? 'image'
            : mediaFile.isAudioFile
              ? 'audio'
              : 'video'
        await applyPreset(mediaType, item.presetId, index)
      }
      clearStoredBatchSession()
      setItems([])
      toast.success(t('home.resume.restored'))
    } catch {
      toast.error(t('media.invalidFiles'))
    }
    setIsResuming(false)
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-10 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/90 p-4 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900/90">
      <p className="text-sm font-medium">{t('home.resume.title')}</p>
      <p className="mt-1 text-xs text-gray-500">
        {t('home.resume.description', { count: items.length })}
      </p>
      <div className="mt-3 flex justify-center gap-2">
        <Button
          size="sm"
          variant="flat"
          onPress={() => {
            clearStoredBatchSession()
            setItems([])
          }}
        >
          {t('home.resume.discard')}
        </Button>
        <Button
          size="sm"
          color="primary"
          isLoading={isResuming}
          onPress={resume}
        >
          {t('home.resume.resume')}
        </Button>
      </div>
    </div>
  )
}

export default ResumeBatch
