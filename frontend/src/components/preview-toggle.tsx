import React from 'react'
import { PrintPreviewToggle } from 'containers/print-preview'
import { css } from 'react-emotion'

const toggleContainer = css`
  @media not print {
    position: fixed;
    top: calc(100vh - 46px);
    left: 10px;
    z-index: 2;
    display: flex;
    align-items: center;
    font-size: 18px;
  }
  @media (max-width: 600px) {
    display: none;
  }
  @media print {
    display: none;
  }
`

const previewToggle = css`
  display: inline-block;
  input {
    display: none;
  }

  div {
    width: 96px;
    height: 28px;
    width: 60px;
    height: 32px;
    border-radius: 16px;
    display: block;
    border: solid 2px black;
    box-sizing: border-box;
    background: s;
    margin-left: 10px;
    background: white;
  }
  div::after {
    position: absolute;
    transform: translate(4px, 4px);
    content: '';
    display: block;
    height: 20px;
    width: 20px;
    background: hsla(0, 57%, 43%, 1);
    border-radius: 15px;
    z-index: 3;
    transition: background 200ms linear, transform 200ms ease-in-out;
  }

  input:checked + div::after {
    transform: translate(32px, 4px);
    background: hsla(121, 57%, 43%, 1);
  }
`

const PreviewToggle = () => (
  <PrintPreviewToggle>
    {(toggle, value) => (
      <label className={toggleContainer}>
        <span>Print preview:</span>
        <span className={previewToggle}>
          <input type="checkbox" checked={value} onChange={toggle} />
          <div />
        </span>
      </label>
    )}
  </PrintPreviewToggle>
)
export default PreviewToggle
