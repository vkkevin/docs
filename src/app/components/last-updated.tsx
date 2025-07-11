'use client'

import { usePathname } from 'next/navigation'
import type { FC, ReactNode } from 'react'
import { useThemeConfig } from 'nextra-theme-docs'

export const LastUpdated: FC<{
  date?: Date
  children?: ReactNode
  locale?: string
}> = ({ date, children = 'Last updated on', locale = 'en' }) => {
  const { i18n } = useThemeConfig()
  const pathname = usePathname()

  if (!date) {
    return null
  }

  const dateLocale = i18n.length ? pathname.split('/', 2)[1] : locale
  return (
    <>
      {children}{' '}
      <time
        dateTime={date.toISOString()}
        // Can provoke React 418 error https://react.dev/errors/418
        suppressHydrationWarning
      >
        {date.toLocaleDateString(dateLocale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })}
      </time>
    </>
  )
}
