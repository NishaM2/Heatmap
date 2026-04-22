import { useState, useEffect } from 'react'

export const useDebounce = (value: string, delay: number = 300): string => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
    // cleanup: if value changes before delay, cancel previous timer
  }, [value, delay])

  return debouncedValue
}