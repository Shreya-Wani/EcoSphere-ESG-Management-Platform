'use client'

/**
 * Presentational theme toggle for the refined prototype.
 *
 * Self-contained visual feature: it only reads/writes a `theme` key in
 * localStorage and toggles the `.app-dark` class on <html>. It touches no
 * data flow, no React Query, and no server logic — the CSS-variable token
 * layer in globals.css does all the actual restyling.
 */

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('app-dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem('es-theme') as Theme | null) ?? 'light'
    setTheme(stored)
    applyTheme(stored)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('es-theme', next)
      applyTheme(next)
      return next
    })
  }

  return { theme, toggle }
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      aria-label="Toggle theme"
      className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors hover:bg-hover hover:text-ink"
    >
      {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
    </button>
  )
}
