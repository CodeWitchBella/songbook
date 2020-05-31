const charMap: { [key: string]: string } = {
  á: 'a',
  é: 'e',
  ě: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ů: 'u',

  ý: 'y',

  ž: 'z',
  š: 's',
  č: 'c',
  ř: 'r',
  ď: 'd',
  ť: 't',
  ň: 'n',
}

export default function latinize(text: string) {
  return text
    .split('')
    .map((ch) => charMap[ch] || ch)
    .join('')
}
