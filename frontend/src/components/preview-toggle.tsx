import React from 'react'
import { PrintPreviewToggle } from 'containers/print-preview'
import { css } from 'react-emotion'

const previewToggle = css`
  @media not print {
    position: fixed;
    height: 46px;
    border: solid 2px black;
    border-radius: 23px;
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.8);
    top: calc(100vh - 56px);
    left: 10px;
    z-index: 2;

    :hover {
      text-decoration: underline;
    }
  }
  @media (max-width: 600px) {
    display: none;
  }
  @media print {
    display: none;
  }
`

const PreviewToggle = () => (
  <PrintPreviewToggle>
    {toggle => (
      <button className={previewToggle} onClick={toggle}>
        Toggle print preview
      </button>
    )}
  </PrintPreviewToggle>
)
export default PreviewToggle
