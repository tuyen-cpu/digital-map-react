/**
 * Favorite service
 */
import api from './api'

export async function apiGetFavorites() {
  const res = await api.get('/favorites/')
  // Return array of locationIds for easy comparison
  return res.data.results.map((f) => f.locationId)
}

export async function apiToggleFavorite(locationId) {
  const res = await api.post('/favorites/toggle/', { locationId })
  return res.data  // { favorited: bool, locationId }
}
