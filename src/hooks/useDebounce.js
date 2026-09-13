import { useEffect, useState } from 'react'

/**
 * Trả về giá trị debounced — chỉ cập nhật sau khi `value` không đổi trong `delay` ms.
 */
export function useDebounce(value, delay = 600) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
