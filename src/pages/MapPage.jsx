import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Route as RouteIcon } from 'lucide-react'
import { useAppState } from '../context/AppStateContext'
import JourneyModal from '../components/JourneyModal'
import LocationDetailDrawer from '../components/LocationDetailDrawer'
import MapView from '../components/MapView'
import PanoramaModal from '../components/PanoramaModal'
import RoutePanel from '../components/RoutePanel'
import Sidebar from '../components/Sidebar'
import { buildDrivingRoute, geocodeAddress, getCurrentPosition } from '../services/routing'
import { hasCoordinates } from '../utils/format'
import { locationMatches } from '../utils/text'

const EMPTY_ROUTE = { route: null, destination: null, origin: null, loading: false, error: '' }

export default function MapPage() {
  const { locations, trackEvent, recordTravel } = useAppState()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const routeToId = searchParams.get('routeTo') || ''
  const shouldNavigate = searchParams.get('nav') === '1' || Boolean(routeToId)
  const [search, setSearch] = useState(initialQuery)
  const [category, setCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [detailLocation, setDetailLocation] = useState(null)
  const [panoramaLocation, setPanoramaLocation] = useState(null)
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [journeyTarget, setJourneyTarget] = useState(null)
  const [userPosition, setUserPosition] = useState(null)
  const [bounds, setBounds] = useState(null)
  const [regionOnly, setRegionOnly] = useState(false)
  const [notice, setNotice] = useState('')
  const [routeState, setRouteState] = useState(EMPTY_ROUTE)
  const [followUser, setFollowUser] = useState(false)
  const [routePanelExpanded, setRoutePanelExpanded] = useState(true)

  const mappableCount = useMemo(() => locations.filter(hasCoordinates).length, [locations])

  useEffect(() => {
    const match = routeToId
      ? locations.find((item) => item.id === routeToId)
      : initialQuery ? locations.find((item) => locationMatches(item, initialQuery)) : null
    if (!match) return undefined
    setSelectedLocation(match)
    setSearch(routeToId ? '' : initialQuery)
    if (!shouldNavigate) {
      setDetailLocation(match)
      return undefined
    }
    if (hasCoordinates(match)) {
      setJourneyTarget(match)
      setJourneyOpen(true)
      return undefined
    }
    setNotice('Đang xác định vị trí điểm đến từ địa chỉ...')
    const controller = new AbortController()
    geocodeAddress(match.address || match.name, controller.signal, 6, { localBias: true })
      .then((results) => {
        if (!results.length) throw new Error('Không tìm thấy tọa độ phù hợp cho địa điểm này.')
        const resolved = { ...match, lat: results[0].lat, lng: results[0].lng, coordinateMethod: 'Định vị tạm thời từ địa chỉ' }
        setSelectedLocation(resolved)
        setJourneyTarget(resolved)
        setJourneyOpen(true)
        setNotice('Đã xác định điểm đến. Hãy chọn điểm xuất phát.')
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setDetailLocation(match)
          setNotice(error.message || 'Chưa thể xác định vị trí điểm đến.')
        }
      })
    return () => controller.abort()
  }, [initialQuery, locations, routeToId, shouldNavigate])

  const filteredLocations = useMemo(() => locations.filter((location) => {
    if (category !== 'all' && location.category !== category) return false
    if (!locationMatches(location, search)) return false
    if (regionOnly && bounds) {
      if (!hasCoordinates(location)) return false
      return bounds.contains([location.lat, location.lng])
    }
    return true
  }), [bounds, category, locations, regionOnly, search])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!followUser || !navigator.geolocation) return undefined
    const watchId = navigator.geolocation.watchPosition(
      (position) => setUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
      () => setNotice('Không thể tiếp tục bám GPS. Kiểm tra quyền định vị của trình duyệt.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [followUser])

  const locate = async () => {
    try {
      const position = await getCurrentPosition()
      setUserPosition(position)
      setNotice('Đã xác định vị trí hiện tại.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  const selectAndOpen = (location) => {
    setSelectedLocation(location)
    setDetailLocation(location)
  }

  const reset = () => {
    setSearch('')
    setCategory('all')
    setRegionOnly(false)
    setSelectedLocation(null)
    setDetailLocation(null)
    setRouteState(EMPTY_ROUTE)
    setFollowUser(false)
    setRoutePanelExpanded(true)
  }

  const startNavigation = async (location) => {
    setSelectedLocation(location)
    if (hasCoordinates(location)) {
      setJourneyTarget(location)
      setJourneyOpen(true)
      return
    }
    setNotice('Đang xác định vị trí điểm đến từ địa chỉ...')
    try {
      const results = await geocodeAddress(location.address || location.name, undefined, 6, { localBias: true })
      if (!results.length) throw new Error('Không tìm thấy tọa độ phù hợp cho địa điểm này.')
      const resolved = { ...location, lat: results[0].lat, lng: results[0].lng, coordinateMethod: 'Định vị tạm thời từ địa chỉ' }
      setSelectedLocation(resolved)
      setJourneyTarget(resolved)
      setJourneyOpen(true)
      setNotice('Đã xác định điểm đến. Hãy chọn điểm xuất phát.')
    } catch (error) {
      setNotice(error.message || 'Chưa thể xác định vị trí điểm đến.')
    }
  }

  const buildRoute = async (origin, destination) => {
    if (origin?.source === 'gps') setUserPosition(origin)
    setRoutePanelExpanded(true)
    setRouteState({ route: null, destination, origin, loading: true, error: '' })
    try {
      const route = await buildDrivingRoute(origin, { lat: destination.lat, lng: destination.lng })
      setRouteState({ route, destination, origin, loading: false, error: '' })
      setSelectedLocation(destination)
      setDetailLocation(null)
      trackEvent('route_start', { locationId: destination.id || '', locationName: destination.name || '', originLabel: origin.label || 'Điểm xuất phát', distanceMeters: Math.round(route.distanceMeters || 0), durationSeconds: Math.round(route.durationSeconds || 0) })
      if (destination.id) recordTravel(destination.id, 'route')
    } catch (error) {
      setRouteState({ route: null, destination, origin, loading: false, error: error.message || 'Không thể tạo lộ trình.' })
    }
  }

  const routeActive = Boolean(routeState.route || routeState.loading || routeState.destination)

  return (
    <main className={`relative grid min-h-[560px] grid-cols-1 bg-blue-50 md:h-[calc(100dvh-5rem)] md:min-h-[620px] md:grid-cols-[390px_1fr] md:grid-rows-1 md:overflow-hidden xl:grid-cols-[430px_1fr] ${routeActive ? 'grid-rows-1' : 'grid-rows-[auto_auto]'}`}>
      <div className={routeActive ? 'hidden min-h-0 md:flex md:h-full' : 'flex min-h-0 h-auto'}>
      <Sidebar
        search={search}
        onSearchChange={(value) => { setSearch(value); setRegionOnly(false) }}
        category={category}
        onCategoryChange={(value) => { setCategory(value); setRegionOnly(false); if (value !== 'all') trackEvent('category_filter', { category: value, section: 'Bản đồ du lịch' }) }}
        locations={filteredLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={selectAndOpen}
        onReset={reset}
        onShowAll={() => { setSearch(''); setCategory('all'); setRegionOnly(false) }}
        onLocate={locate}
        onShowInBounds={() => setRegionOnly(true)}
        onOpenDetails={selectAndOpen}
        totalCount={locations.length}
        mappableCount={mappableCount}
      />
      </div>
      <div className="relative min-h-0 overflow-hidden">
        <MapView
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={selectAndOpen}
          onLocate={locate}
          userPosition={userPosition}
          route={routeState.route}
          routeOrigin={routeState.origin}
          routeDestination={routeState.destination}
          followUser={followUser}
          onBoundsChange={setBounds}
        />
        {!routeState.route && !routeState.loading && <button type="button" onClick={() => { setJourneyTarget(hasCoordinates(selectedLocation) ? selectedLocation : null); setJourneyOpen(true) }} className="absolute left-3 top-14 z-[650] inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-black text-white shadow-soft hover:bg-brand-700 sm:left-auto sm:right-16 sm:top-3"><RouteIcon size={16} /> Bạn muốn đi đâu?</button>}
        <RoutePanel
          {...routeState}
          followUser={followUser}
          expanded={routePanelExpanded}
          onToggleExpanded={() => setRoutePanelExpanded((value) => !value)}
          onToggleFollow={() => { setFollowUser((value) => !value); if (!userPosition) locate() }}
          onStop={() => { setRouteState(EMPTY_ROUTE); setFollowUser(false); setRoutePanelExpanded(true) }}
        />
      </div>

      {notice && <div className="fixed bottom-5 left-1/2 z-[1900] max-w-[90vw] -translate-x-1/2 rounded-xl bg-brand-800 px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl">{notice}</div>}
      <LocationDetailDrawer location={detailLocation} onClose={() => setDetailLocation(null)} onNavigate={(location) => { setDetailLocation(null); startNavigation(location) }} onPanorama={(location) => { setDetailLocation(null); setPanoramaLocation(location) }} />
      <PanoramaModal location={panoramaLocation} onClose={() => setPanoramaLocation(null)} />
      {journeyOpen && <JourneyModal key={`${journeyTarget?.id || 'free'}-${journeyOpen}`} open locations={locations} initialDestination={journeyTarget} onClose={() => setJourneyOpen(false)} onRoute={buildRoute} />}
    </main>
  )
}
