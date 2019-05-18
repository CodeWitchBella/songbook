// make this a augmentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Document from 'react-pdf/dist/Document'

declare module 'react-pdf' {
  export const pdfjs: any
}
