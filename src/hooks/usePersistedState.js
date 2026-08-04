import { useEffect, useState } from 'react'
import { loadState, saveState } from '../utils/storage'

export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => loadState(key, initialValue))

  useEffect(() => {
    saveState(key, value)
  }, [key, value])

  return [value, setValue]
}
