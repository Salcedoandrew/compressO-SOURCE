// The item must be HeroUI's own (not a wrapper) so the Select can build its collection
import { SelectItem, type SelectProps } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'

import Select from '@/components/Select'
import { presetsStore } from '@/stores/presetsStore'
import {
  DEFAULT_PRESET_CHOICE,
  type Preset,
  type PresetMediaType,
} from '@/types/preset'
import {
  PHOTO_DELIVERY_PRESET_ID,
  PHOTO_DELIVERY_PRESET_NAME,
} from '@/utils/photoDelivery'
import { getPresetChoice } from '@/utils/presetOutput'
import { getPresets } from '../../-presets'

type PresetChoiceSelectProps = Omit<
  SelectProps,
  'children' | 'selectedKeys' | 'onSelectionChange' | 'onChange'
> & {
  mediaType: PresetMediaType
  /** The stored choice (see `getPresetChoice`) */
  value: string | null | undefined
  onChange: (choice: string) => void
}

/**
 * Picks a preset of a type of media: Default first (following the default preset, starred in
 * Settings -> Presets, which it names), then Standard & the other presets
 */
function PresetChoiceSelect(props: PresetChoiceSelectProps) {
  const { mediaType, value, onChange, ...rest } = props
  const { t } = useTranslation()
  const { presets, defaultPresetIds } = useSnapshot(presetsStore)
  const options = getPresets(mediaType, presets as Preset[])
  const defaultPreset =
    options.find((preset) => preset.id === defaultPresetIds[mediaType]) ??
    options[0]
  const defaultPresetName =
    defaultPreset.id === PHOTO_DELIVERY_PRESET_ID &&
    defaultPreset.name === PHOTO_DELIVERY_PRESET_NAME
      ? t('presets.photoDelivery')
      : defaultPreset.name

  return (
    <Select
      {...rest}
      selectedKeys={[getPresetChoice(value, mediaType, presets as Preset[])]}
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const [key] = [...keys]
        if (key) onChange(String(key))
      }}
    >
      {[
        {
          id: DEFAULT_PRESET_CHOICE,
          name: t('presets.defaultChoice', { name: defaultPresetName }),
        },
        ...options,
      ].map((preset) => (
        <SelectItem key={preset.id}>
          {preset.id === PHOTO_DELIVERY_PRESET_ID &&
          preset.name === PHOTO_DELIVERY_PRESET_NAME
            ? t('presets.photoDelivery')
            : preset.name}
        </SelectItem>
      ))}
    </Select>
  )
}

export default PresetChoiceSelect
