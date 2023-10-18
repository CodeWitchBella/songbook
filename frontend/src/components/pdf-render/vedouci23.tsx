import { useIsInPDF } from './primitives'

export default function V() {
  const inPdf = useIsInPDF()
  const Path: typeof import('@react-pdf/renderer').Path = (
    inPdf ? 'PATH' : 'path'
  ) as any
  const Svg: typeof import('@react-pdf/renderer').Svg = (
    inPdf ? 'SVG' : 'svg'
  ) as any
  return (
    <Svg width="300mm" viewBox="0 0 248.486 242.401">
      <Path
        d="M105.906 224.11c.933-3.954 18.93-82.999 18.93-83.146 0-.109 1.795-.198 3.987-.198 3.673 0 3.976.036 3.85.463-.074.254-1.34 5.761-2.813 12.237-1.473 6.475-4.104 18.008-5.847 25.628-1.743 7.62-3.134 13.954-3.09 14.075.042.12 9.607-11.65 21.254-26.158l21.178-26.378 4.685-.072c2.578-.04 4.686-.013 4.686.06s-4.203 5.403-9.34 11.846c-24.767 31.062-52.2 65.498-54.544 68.468-3.238 4.102-3.127 3.982-2.936 3.175zm83.645-33.477-26.9-33.76 2.42-3.033 2.421-3.032 17.097 21.421c9.403 11.782 17.118 21.4 17.144 21.372.026-.028-3.391-14.92-7.594-33.093-4.203-18.173-7.564-33.175-7.468-33.337.58-.989 6.023-7.857 6.076-7.669.036.126 2.507 10.945 5.49 24.042 2.984 13.097 8.347 36.602 11.918 52.233 3.57 15.632 6.448 28.465 6.394 28.519-.054.054-12.203-15.095-26.998-33.663zm-42.524-53.238c-4.3-5.35-7.974-9.98-8.167-10.288-.3-.482-.212-1.161.635-4.894.541-2.383 1.034-4.487 1.096-4.674.094-.289 19.17 23.228 19.17 23.634 0 .196-4.505 5.793-4.733 5.88-.1.039-3.701-4.308-8-9.658zm10.238-3.096c-1.828-2.247-3.324-4.153-3.324-4.236 0-.082 6.926-.119 15.391-.081l15.391.068.336 1.455c.185.8.627 2.676.983 4.168l.646 2.712h-26.099zm42.184 3.951c0-.2-1.583-7.33-1.747-7.87-.133-.438 1.259-.463 26.534-.486l26.675-.025-29.825-14.858c-16.404-8.172-29.942-14.979-30.085-15.125-.238-.244-2.216-8.354-2.068-8.477.036-.03 21.762 10.438 48.28 23.262l48.214 23.317-20.962.16c-27.8.211-65.016.27-65.016.102zm-162.507-.435c.102-.095 8.996-4.396 19.765-9.558a86174.493 86174.493 0 0 0 38.662-18.546c10.496-5.04 19.187-9.16 19.314-9.156.293.007 4.2 4.958 4.2 5.322 0 .149-11.013 5.57-24.473 12.049-13.461 6.478-24.534 11.837-24.607 11.908-.072.071 6 .06 13.494-.025 7.495-.085 22.854-.22 34.131-.3l20.506-.147 3.355 4.245 3.356 4.246-53.944.067c-29.67.037-53.86-.01-53.759-.105zm91.204-11.138c.418-1.724 5.225-22.756 5.464-23.907l.28-1.35 4.26-2.012c2.343-1.106 4.308-1.964 4.366-1.905.06.059-1.417 6.78-3.28 14.938l-3.386 14.831h-7.848zm48.625-3.175c1.649-2.074 5.834-7.342 9.3-11.708 3.467-4.366 6.377-8.02 6.468-8.122.09-.101 1.748.579 3.685 1.512l3.52 1.696-2.154 2.721c-1.185 1.497-4.794 6.08-8.02 10.185l-5.863 7.464-4.967.01-4.966.012zm-48.92-10.201c-.86-1.1-60.977-76.509-63.742-79.956-1.342-1.674-2.41-3.079-2.372-3.123.077-.09 76.88 36.7 77.194 36.978.254.225-1.172 6.89-1.474 6.89-.303 0-1.216-.433-25.585-12.166-25.368-12.213-24.612-11.86-24.046-11.207.233.268 9.568 12.036 20.745 26.152 11.177 14.115 20.73 26.167 21.23 26.78l.907 1.117-1.107 4.639c-.609 2.55-1.126 4.631-1.15 4.623-.023-.008-.293-.335-.6-.727zm51.793-16.846c-1.936-8.397-3.48-15.3-3.433-15.34.211-.178 6.923-3.317 6.96-3.256.024.038 1.415 5.902 3.092 13.033l3.049 12.964-2.328 3.043c-1.28 1.674-2.664 3.443-3.074 3.933l-.747.89zm-51.569 1.306-2.185-2.757 1.26-.634c3.36-1.692 23.317-11.019 23.578-11.019.397 0 7.446 3.52 7.446 3.718 0 .12-27.058 13.184-27.75 13.398-.09.028-1.147-1.19-2.349-2.706zm75.524-2.053-3.39-1.641 7.595-9.525c4.177-5.239 10.342-12.978 13.7-17.198 3.357-4.22 7.744-9.727 9.749-12.237 2.004-2.51 3.59-4.564 3.524-4.564-.132 0-9.391 4.437-41.39 19.831l-21.011 10.109-3.947-1.8c-2.17-.99-3.994-1.877-4.052-1.97-.058-.095 18.912-9.258 42.156-20.364l47.942-22.907c3.124-1.493 5.723-2.672 5.775-2.62.052.052-8.819 11.267-19.712 24.923a88996.953 88996.953 0 0 0-26.497 33.229c-3.68 4.62-6.772 8.395-6.871 8.388-.1-.007-1.706-.751-3.57-1.654zm-40.884-9.433c-7.18-3.477-13.103-6.371-13.164-6.432-.119-.119 1.148-6.567 1.325-6.744.13-.13 22.644 10.49 23.096 10.893.23.206 2.194 7.846 2.194 8.538 0 .232-1.4-.419-13.45-6.255zm-25.352-.08c.141-.567 5.454-23.824 17.664-77.324 6.481-28.4 6.18-27.158 6.397-26.458.305.987 18.975 83.01 18.975 83.364 0 .421-6.63 3.649-6.898 3.358-.103-.112-2.945-11.571-6.317-25.465-3.371-13.893-6.168-25.299-6.215-25.346-.115-.115.406-2.373-7.16 31.028a16979.842 16979.842 0 0 1-6.998 30.824c-.124.51-.302 1.265-.395 1.679-.152.668-.657.987-4.517 2.844-2.39 1.15-4.422 2.092-4.515 2.092-.093 0-.103-.268-.021-.596z"
        style={{ fill: '#000', strokeWidth: 0.264583 }}
        transform="translate(-36.942 17.843)"
      />
    </Svg>
  )
}
