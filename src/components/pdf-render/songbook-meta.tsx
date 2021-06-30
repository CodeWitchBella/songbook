import { DateTime } from 'luxon'

import deti21 from './deti21.png'
import vedouci21 from './vedouci21.png'
import extra21 from './extra21.png'

const titleMap: {
  [key: string]: {
    title: string
    subtitle: string
    footer: string
    imageViewHeight: number
    imageViewPaddingTop: number
    imageWidth?: number
    imageOnly: boolean
    image?: string
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
  'Kačlehy 2021 Děti': {
    title: 'Zpěvy ASAP',
    subtitle: 'v2.0.21',
    footer: 'Zpěvy ARGO Akademie™ v2.0.21',
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: deti21,
  },
  'Kačlehy 2021 Vedoucí': {
    title: 'Vesmírné zpěvy',
    subtitle: 'v2.0.21',
    footer: 'ARGO™ zpěvy v2.0.21',
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: vedouci21,
  },
  'Kačlehy 2021 Extra': {
    title: 'Krákorání',
    subtitle: 'v2.0.21',
    footer: 'Krákorání v2.0.21',
    imageViewHeight: 40,
    imageViewPaddingTop: 0,
    imageWidth: 30,
    imageOnly: false,
    image: extra21,
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
