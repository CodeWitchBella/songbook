import { DateTime } from 'luxon'

const titleMap: {
  [key: string]: {
    title: string
    subtitle: string
    footer: string
    imageViewHeight: number
    imageViewPaddingTop: number
    imageWidth?: number
    imageOnly: boolean
  }
} = {
  'Kačlehy 2020 Děti': {
    title: 'Oslavné zpěvy',
    subtitle: 'Panhellenský sněm 2020',
    footer: 'Panhellenský sněm 2020',
    imageViewHeight: 36,
    imageViewPaddingTop: 3,
    imageWidth: undefined,
    imageOnly: false,
  },
  'Kačlehy 2020 Vedoucí': {
    title: '',
    subtitle: '',
    footer: 'Kačlehopolis 2020',
    imageViewHeight: 50,
    imageViewPaddingTop: 0,
    imageWidth: undefined,
    imageOnly: true,
  },
}

export function getSongbookMeta(title: string, time: DateTime) {
  return (
    titleMap[title] || {
      footer: 'zpevnik.skorepova.info',
      imageViewHeight: 30,
      imageViewPaddingTop: 0,
      subtitle: time.setZone('local').toFormat('d. M. yyyy'),
      title,
      imageWidth: 20,
    }
  )
}
