/**
 * useCategories() — returns live categories from ApiStateContext,
 * falling back to static list if not yet loaded.
 */
import { useAppState } from '../context/AppStateContext'
import { CATEGORIES_STATIC, getCategory } from '../utils/categories'

export function useCategories() {
  let live = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useAppState()
    live = state?.categories
  } catch {}

  const categories = Array.isArray(live) && live.length > 0 ? live : CATEGORIES_STATIC

  return {
    categories,
    getCategory: (key) => getCategory(key, categories),
  }
}
