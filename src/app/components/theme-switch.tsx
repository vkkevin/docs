'use client'

import cn from 'clsx'
import { useTheme } from 'next-themes'
import { Button } from 'nextra/components'
import { useMounted } from 'nextra/hooks'
import { MoonIcon, SunIcon } from 'nextra/icons'
import type { FC } from 'react'
import { useThemeConfig } from 'nextra-theme-docs';

type ThemeToggleProps = {
  lite?: boolean
  className?: string
}

export const ThemeToggle: FC<ThemeToggleProps> = ({ lite, className }) => {
  const { setTheme, resolvedTheme, theme } = useTheme()
  const mounted = useMounted()
  const { darkMode, themeSwitch } = useThemeConfig()
  if (!darkMode) {
    return null
  }
  const IconToUse = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon
  const id = mounted ? (theme as keyof typeof themeSwitch) : 'light'
  const nextTheme = mounted && resolvedTheme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      className={({ hover }) =>
        cn(
          'x:flex x:items-center x:gap-2 x:cursor-pointer x:rounded-md x:p-2',
          hover ? 'x:bg-gray-100 x:dark:bg-primary-100/5' : '',
          className
        )
      }
      title="Toggle theme"
      onClick={() => setTheme(nextTheme)}
      type="button"
    >
      <IconToUse height={12} />
      {!lite && themeSwitch[id]}
    </Button>
  )
}