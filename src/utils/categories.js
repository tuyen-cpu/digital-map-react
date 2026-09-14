/**
 * Static fallback categories — used when API hasn't loaded yet.
 * Source of truth is the DB. Admin can CRUD via /admin → Danh mục tab.
 */
export const CATEGORIES_STATIC = [
  { key: 'tourism',        label: 'Khu/điểm du lịch',     shortLabel: 'Du lịch',    emoji: '🏛️', marker: '#1d4ed8', description: 'Di tích, danh thắng, không gian văn hóa, tâm linh và các điểm tham quan.' },
  { key: 'lodging',        label: 'Lưu trú du lịch',        shortLabel: 'Lưu trú',    emoji: '🛏️', marker: '#2563eb', description: 'Khách sạn, nhà nghỉ và cơ sở lưu trú phục vụ du khách.' },
  { key: 'food',           label: 'Ẩm thực',                shortLabel: 'Ẩm thực',   emoji: '🍜', marker: '#0284c7', description: 'Nhà hàng, quán ăn, cà phê, trà sữa và các địa chỉ ẩm thực địa phương.' },
  { key: 'entertainment',  label: 'Giải trí',               shortLabel: 'Giải trí',  emoji: '🎯', marker: '#0369a1', description: 'Công viên, thể thao, karaoke và các điểm vui chơi giải trí.' },
  { key: 'health',         label: 'Chăm sóc sức khỏe',      shortLabel: 'Sức khỏe',  emoji: '💙', marker: '#0e7490', description: 'Trạm y tế, phòng khám, nhà thuốc và dịch vụ chăm sóc sức khỏe.' },
  { key: 'administration', label: 'Cơ quan hành chính',     shortLabel: 'Hành chính',emoji: '🏢', marker: '#1e40af', description: 'UBND, Công an, Trung tâm hành chính công, Đảng ủy và các cơ quan phường.' },
  { key: 'utility',        label: 'Tiện ích',               shortLabel: 'Tiện ích',  emoji: '📍', marker: '#1e3a8a', description: 'Ngân hàng, chợ, trường học, bưu chính, điện và các dịch vụ thiết yếu.' },
]

// Backward-compat alias used by many existing components
export const CATEGORIES = CATEGORIES_STATIC

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES_STATIC.map((c) => [c.key, c]))

/**
 * getCategory(key, dynamicList?) — lookup with optional dynamic override.
 */
export function getCategory(key, dynamicList = null) {
  if (dynamicList?.length) {
    const found = dynamicList.find((c) => c.key === key)
    if (found) return found
  }
  return CATEGORY_BY_KEY[key] ?? {
    key: key || 'utility', label: key || 'Tiện ích', shortLabel: key || 'Tiện ích',
    emoji: '📍', marker: '#1e3a8a', description: '',
  }
}
