"use client"

import { useState, useCallback, useEffect } from 'react'
import type { ViewMode } from '@/lib/types/feed'

const STORAGE_KEY = 'feed-view-mode'

export function useViewMode(defaultMode: ViewMode = 'grid') {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'grid' || stored === 'list') {
      setViewModeState(stored)
    }
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  return { viewMode, setViewMode }
}
