import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { hasCoordinates } from '../utils/format'

const DEFAULT_CENTER = [13.8932, 109.058]

function icon(label = '✓') {
  return L.divIcon({
    className: 'location-marker-shell',
    html: `<div class="route-origin-marker" style="background:#2563eb;color:white">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  })
}

function Fitter({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) map.setView(points[0], 15)
    else map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 16 })
  }, [map, points])
  return null
}

export default function VisitedMap({ locations = [], history = [] }) {
  const historyById = useMemo(() => new Map(history.map((entry) => [entry.locationId, entry])), [history])
  const visited = useMemo(() => locations.filter((item) => historyById.has(item.id) && hasCoordinates(item)), [historyById, locations])
  const points = useMemo(() => visited.map((item) => [item.lat, item.lng]), [visited])

  return (
    <div className="h-[330px] overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 sm:h-[420px]">
      <MapContainer center={DEFAULT_CENTER} zoom={13} className="h-full w-full" zoomControl>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {visited.map((location) => {
          const entry = historyById.get(location.id)
          return <Marker key={location.id} position={[location.lat, location.lng]} icon={icon(entry?.visitedAt ? '✓' : '•')}><Popup><strong>{location.name}</strong><br />{entry?.visitedAt ? `Đã đến: ${new Date(entry.visitedAt).toLocaleString('vi-VN')}` : 'Đã lưu trong lịch sử hành trình'}</Popup></Marker>
        })}
        <Fitter points={points} />
      </MapContainer>
    </div>
  )
}
