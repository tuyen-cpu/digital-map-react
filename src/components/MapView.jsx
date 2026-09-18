import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Circle, GeoJSON, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Crosshair, Info, LocateFixed, Maximize2, RotateCcw } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { hasCoordinates } from '../utils/format'
import { loadBoundary } from '../services/boundary'

const DEFAULT_CENTER = [13.8932, 109.058]
const DEFAULT_ZOOM = 13

function makeLocationIcon(location, selected, getCategoryFn) {
  const category = getCategoryFn(location.category)
  return L.divIcon({
    className: 'location-marker-shell',
    html: `<div class="location-marker ${selected ? 'is-selected' : ''}" style="--marker:${category.marker}"><span>${category.emoji}</span></div>`,
    iconSize: selected ? [44, 44] : [38, 38],
    iconAnchor: selected ? [22, 40] : [19, 35]
  })
}

function makeRouteOriginIcon() {
  return L.divIcon({
    className: 'location-marker-shell',
    html: '<div class="route-origin-marker">A</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  })
}

function SelectionController({ selectedLocation, routeActive }) {
  const map = useMap()
  useEffect(() => {
    if (!routeActive && hasCoordinates(selectedLocation)) map.flyTo([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 16), { duration: 0.65 })
  }, [map, routeActive, selectedLocation])
  return null
}

function UserFollower({ userPosition, followUser }) {
  const map = useMap()
  useEffect(() => {
    if (followUser && userPosition) map.flyTo([userPosition.lat, userPosition.lng], Math.max(map.getZoom(), 16), { duration: 0.5 })
  }, [followUser, map, userPosition])
  return null
}

function BoundaryFitter({ boundary, enabled }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (!enabled || fitted.current || !boundary?.features?.length) return
    try {
      const bounds = L.geoJSON(boundary).getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
        fitted.current = true
      }
    } catch {}
  }, [boundary, enabled, map])
  return null
}

function RouteFitter({ route, origin, destination }) {
  const map = useMap()
  useEffect(() => {
    if (!route?.coordinates?.length) return
    const points = [...route.coordinates]
    if (origin) points.push([origin.lat, origin.lng])
    if (destination) points.push([destination.lat, destination.lng])
    const bounds = L.latLngBounds(points)
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
  }, [destination, map, origin, route])
  return null
}

function BoundsObserver({ onBoundsChange }) {
  const map = useMapEvents({ moveend: () => onBoundsChange?.(map.getBounds()), zoomend: () => onBoundsChange?.(map.getBounds()) })
  useEffect(() => { onBoundsChange?.(map.getBounds()) }, [map, onBoundsChange])
  return null
}

function MapButtons({ onLocate }) {
  const map = useMap()
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[500] flex flex-col gap-2">
      <button type="button" onClick={() => map.zoomIn()} className="map-control" aria-label="Phóng to">+</button>
      <button type="button" onClick={() => map.zoomOut()} className="map-control" aria-label="Thu nhỏ">−</button>
      <button type="button" onClick={onLocate} className="map-control" aria-label="Vị trí hiện tại"><LocateFixed size={17} /></button>
      <button type="button" onClick={() => map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM)} className="map-control" aria-label="Về trung tâm"><RotateCcw size={16} /></button>
      <button type="button" onClick={() => map.invalidateSize()} className="map-control" aria-label="Làm mới kích thước bản đồ"><Maximize2 size={15} /></button>
    </div>
  )
}

export default function MapView({ locations, selectedLocation, onSelectLocation, onLocate, userPosition, route, routeOrigin, routeDestination, followUser, onBoundsChange }) {
  const { getCategory: getLiveCat } = useCategories()
  const [boundaryState, setBoundaryState] = useState({ data: null, isFallback: false, loading: true, error: null })
  useEffect(() => {
    const controller = new AbortController()
    loadBoundary(controller.signal)
      .then(({ data, isFallback, source }) => setBoundaryState({ data, isFallback, source, loading: false, error: null }))
      .catch((error) => { if (error?.name !== 'AbortError') setBoundaryState((current) => ({ ...current, loading: false, error: error.message })) })
    return () => controller.abort()
  }, [])

  const routeActive = Boolean(route || routeDestination)
  const markers = useMemo(() => {
    if (routeActive) return hasCoordinates(routeDestination) ? [routeDestination] : []
    return locations.filter(hasCoordinates)
  }, [locations, routeActive, routeDestination])
  const selectedIcon = useMemo(() => selectedLocation && hasCoordinates(selectedLocation) ? makeLocationIcon(selectedLocation, true, getLiveCat) : null, [selectedLocation, getLiveCat])
  const effectiveOrigin = followUser && userPosition ? userPosition : routeOrigin

  return (
    <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden bg-blue-100 md:h-full md:min-h-0">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} zoomControl={false} className="h-full w-full" preferCanvas>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {boundaryState.data && <GeoJSON key={boundaryState.isFallback ? 'fallback-boundary' : 'full-boundary'} data={boundaryState.data} style={{ color: '#2563eb', weight: 3, fillColor: '#60a5fa', fillOpacity: 0.07, dashArray: boundaryState.isFallback ? '8 8' : undefined }} />}
        {markers.map((location) => {
          const selected = selectedLocation?.id === location.id || routeDestination?.id === location.id
          const icon = selected && selectedIcon ? selectedIcon : makeLocationIcon(location, selected, getLiveCat)
          return <Marker key={location.id} position={[location.lat, location.lng]} icon={icon} eventHandlers={{ click: () => onSelectLocation?.(location) }} />
        })}
        {routeActive && effectiveOrigin && <Marker position={[effectiveOrigin.lat, effectiveOrigin.lng]} icon={makeRouteOriginIcon()} />}
        {!routeActive && userPosition && <>
          <Circle center={[userPosition.lat, userPosition.lng]} radius={Math.max(userPosition.accuracy || 20, 12)} pathOptions={{ color: '#0284c7', weight: 1, fillOpacity: 0.12 }} />
          <Marker position={[userPosition.lat, userPosition.lng]} icon={L.divIcon({ className: 'user-marker-shell', html: '<div class="user-marker"><div></div></div>', iconSize: [22, 22], iconAnchor: [11, 11] })} />
        </>}
        {route?.coordinates?.length > 1 && <Polyline positions={route.coordinates} pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.86 }} />}
        <SelectionController selectedLocation={selectedLocation} routeActive={routeActive} />
        <UserFollower userPosition={userPosition} followUser={followUser} />
        {boundaryState.data && !boundaryState.isFallback && <BoundaryFitter boundary={boundaryState.data} enabled={!routeActive} />}
        <RouteFitter route={route} origin={effectiveOrigin} destination={routeDestination} />
        <BoundsObserver onBoundsChange={onBoundsChange} />
        <MapButtons onLocate={onLocate} />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-5rem)]"><div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/95 px-3 py-2 text-xs font-bold text-blue-800 shadow-card backdrop-blur"><Crosshair size={14} />{routeActive ? 'Chỉ hiển thị điểm đi và điểm đến' : boundaryState.loading ? 'Đang tải ranh giới Phường Bình Định...' : boundaryState.isFallback ? 'Đang dùng vùng bao dự phòng' : 'Ranh giới Phường Bình Định · mã 21907'}</div></div>
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-[500] -translate-x-1/2"><div className="flex items-center gap-2 rounded-full bg-brand-800/90 px-3 py-2 text-[11px] font-semibold text-white shadow-soft backdrop-blur"><Info size={13} className="text-sky-200" />{routeActive ? 'Tuyến đường: 2 điểm' : `${markers.length} marker đang hiển thị`}</div></div>
    </div>
  )
}
