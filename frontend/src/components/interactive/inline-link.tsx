import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function InlineLink({
  children,
  to,
}: {
  to: string
  children: ReactNode
}) {
  return (
    <Link
      className="border-current text-black underline hover:italic dark:text-white"
      to={to}
    >
      {children}
    </Link>
  )
}
