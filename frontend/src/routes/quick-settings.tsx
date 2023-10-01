import { useContinuousModeSetting } from 'components/continuous-mode'
import { useDarkModeSetting } from 'components/dark-mode'
import { InlineLink } from 'components/interactive/inline-link'
import { useLanguage } from 'components/localisation'
import { PageHeader } from 'components/page-header'
import { TH2, TText } from 'components/themed'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function QuickSettings() {
  const { t } = useTranslation()
  const darkMode = useDarkModeSetting()
  const [lng, setLng] = useLanguage()
  const [continuous, setContinuous] = useContinuousModeSetting()
  return (
    <div className="mx-auto w-full max-w-lg px-1 pb-2">
      <PageHeader>{t('quick-settings.Quick settings')}</PageHeader>

      <TitledSelect
        title={t('Appearance')}
        value={darkMode.setting}
        onChange={darkMode.setSetting}
        options={[
          ['light', t('Light')],
          ['dark', t('Dark')],
          ['automatic', t('Automatic')],
        ]}
      />
      <TitledSelect
        title={t('continuous.Continuous mode')}
        value={continuous}
        onChange={setContinuous}
        options={[
          ['always', t('continuous.always')],
          ['never', t('continuous.never')],
          ['multipage', t('continuous.multipage')],
        ]}
      />
      <TText>{t('continuous.description')}</TText>
      <TitledSelect
        title={t('Language')}
        value={lng}
        onChange={setLng}
        options={[
          ['en', 'English'],
          ['cs', 'Česky'],
        ]}
      />
      <Titled title={t('quick-settings.More options')}>
        <InlineLink to="/about">{t('Settings and about')}</InlineLink>
      </Titled>
    </div>
  )
}

function Titled({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={style.titled}>
      <TH2>{title}</TH2>
      <View style={style.titledRight}>{children}</View>
    </View>
  )
}

function TitledSelect<T extends string>({
  title,
  value,
  onChange,
  options,
}: {
  title: string
  value: T
  onChange: (v: T) => void
  options: readonly (readonly [T, string])[]
}) {
  return (
    <Titled title={title}>
      <select
        style={{
          border: '1px solid currentColor',
          borderRadius: 4,
          paddingInline: 16,
          paddingBlock: 8,
          background: 'transparent',
          color: 'inherit',
        }}
        onChange={(evt) => {
          onChange(evt.currentTarget.value as any)
        }}
        value={value}
      >
        {options.map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </select>
    </Titled>
  )
}

const style = StyleSheet.create({
  titled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titledRight: {
    paddingVertical: 16,
  },
})
