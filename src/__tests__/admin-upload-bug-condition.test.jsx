// @vitest-environment jsdom
/**
 * Bug Condition Exploration Tests — Admin Upload UX
 *
 * These tests are EXPECTED TO FAIL on the current (unfixed) code.
 * Failure = confirmation that the bugs exist.
 *
 * Bugs under test:
 *   1. AdminLocationModal.saveFiles() — awaits uploadMedia() before patching state,
 *      so no preview is shown immediately when a file is selected.
 *   2. AdminPage.uploadSlide() — same issue: awaits upload before updating slide image.
 *   3. AdminPage footer tab — "URL logo tùy chỉnh" field has no <input type="file">,
 *      only a text input; user cannot upload a logo from disk.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock react-leaflet so map components don't explode in jsdom
// ---------------------------------------------------------------------------
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  CircleMarker: () => null,
  useMap: () => ({ flyTo: vi.fn(), getZoom: () => 13 }),
  useMapEvents: () => null,
}))

// ---------------------------------------------------------------------------
// Mock uploadMedia with a NEVER-RESOLVING promise (simulates slow upload)
// ---------------------------------------------------------------------------
vi.mock('../services/mediaService', () => ({
  uploadMedia: vi.fn(() => new Promise(() => {})), // never resolves
  deleteMedia: vi.fn(() => Promise.resolve()),
}))

// ---------------------------------------------------------------------------
// Mock the api service (used internally by auth/location services)
// ---------------------------------------------------------------------------
vi.mock('../services/api', () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
  saveTokens: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Minimal context value for useAppState
// ---------------------------------------------------------------------------
const MOCK_ADMIN_SESSION = {
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
  phone: '0901234567',
  mustChangePassword: false,
  permissions: {},
}

const MOCK_SITE_SETTINGS = {
  heroSlides: [
    { id: 'slide-1', image: 'https://example.com/old-slide.jpg', title: 'Slide 1', caption: 'Caption 1' },
  ],
  heroIntervalMs: 5200,
  footer: {
    orgName: 'UBND Phường Bình Định',
    phone: '0256.3825.123',
    address: '123 Đường Lê Lợi',
    email: 'info@example.com',
    workingHours: '7:00 - 17:00',
    copyright: '© 2024',
    description: 'Mô tả ngắn',
    logoUrl: '',
  },
}

const MOCK_CATEGORIES = [
  { key: 'utility', label: 'Tiện ích', shortLabel: 'Tiện ích', emoji: '📍', marker: '#1e3a8a', suggestedGroups: [], suggestedSubgroups: [], suggestedKeywords: [] },
  { key: 'tourism', label: 'Du lịch', shortLabel: 'Du lịch', emoji: '🏛️', marker: '#1d4ed8', suggestedGroups: [], suggestedSubgroups: [], suggestedKeywords: [] },
]

const mockAppState = {
  session: MOCK_ADMIN_SESSION,
  locations: [],
  locationsLoaded: true,
  favorites: [],
  reviews: [],
  travelHistory: [],
  currentTravelHistory: [],
  reminders: [],
  currentReminders: [],
  analyticsEvents: [],
  siteSettings: MOCK_SITE_SETTINGS,
  siteSettingsLoaded: true,
  users: [],
  categories: MOCK_CATEGORIES,
  reviewNotifications: [],
  unreadReviewNotifications: [],
  unreadReviewCount: 0,
  // Auth
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  // Locations
  addLocation: vi.fn(),
  updateLocation: vi.fn(),
  deleteLocation: vi.fn(),
  resetLocations: vi.fn(),
  replaceLocations: vi.fn(),
  canManageLocation: vi.fn(() => true),
  canManageCategory: vi.fn(() => true),
  // Reviews
  addReview: vi.fn(),
  replyToReview: vi.fn(),
  deleteReview: vi.fn(),
  deleteReviewReply: vi.fn(),
  // Favorites
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
  // Travel
  recordTravel: vi.fn(),
  removeTravelHistory: vi.fn(),
  addReminder: vi.fn(),
  deleteReminder: vi.fn(),
  completeReminder: vi.fn(),
  markReminderNotified: vi.fn(),
  // Admin
  deleteUser: vi.fn(),
  updateUserAccount: vi.fn(),
  resetUserPassword: vi.fn(),
  // Site settings
  updateSiteSettings: vi.fn(),
  resetSiteSettings: vi.fn(),
  // Analytics
  trackEvent: vi.fn(),
  clearAnalytics: vi.fn(),
  markReviewNotificationsRead: vi.fn(),
  // Categories
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  refreshCategories: vi.fn(),
  setReviews: vi.fn(),
}

// Mock useAppState so components get our stub context
vi.mock('../context/AppStateContext', () => ({
  useAppState: () => mockAppState,
}))
vi.mock('../context/ApiStateContext', () => ({
  useAppState: () => mockAppState,
  ApiStateProvider: ({ children }) => children,
}))

// Mock react-router-dom hooks used by AdminPage
const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams()
const mockSetSearchParams = vi.fn((params) => {
  mockSearchParams = typeof params === 'function' ? params(mockSearchParams) : new URLSearchParams(params)
})

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    Navigate: ({ to }) => <div data-testid="navigate-to">{to}</div>,
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap in MemoryRouter for components that use Link etc. */
function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

function makeFile(name = 'photo.jpg', type = 'image/jpeg', sizeBytes = 1024) {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

// ---------------------------------------------------------------------------
// Import components AFTER mocks are registered
// ---------------------------------------------------------------------------
import AdminLocationModal from '../components/AdminLocationModal'
import AdminPage from '../pages/AdminPage'

// ---------------------------------------------------------------------------
// Suite 1 — AdminLocationModal: image upload preview
// ---------------------------------------------------------------------------
describe('Bug 1 — AdminLocationModal: image preview appears immediately on file select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show a blob URL preview in the main image <img> immediately after file input change — FAILS on unfixed code', async () => {
    /**
     * Validates: Bug #1 — saveFiles() awaits upload before patching image state.
     * Expected on UNFIXED code: assertion fails because no blob preview URL appears.
     */
    renderWithRouter(
      <AdminLocationModal
        open={true}
        location={null}
        allLocations={[]}
        allowedCategories={['utility', 'tourism']}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // Find the hidden file input for the main image (labeled "Chọn ảnh từ máy")
    const fileInputs = document.querySelectorAll('input[type="file"]')
    // The first file input in the main image section accepts image/*
    const imageFileInput = Array.from(fileInputs).find(
      (input) => input.accept === 'image/*' && !input.multiple
    )
    expect(imageFileInput, 'Main image file input should exist').toBeTruthy()

    const file = makeFile('hero.jpg', 'image/jpeg', 2048)

    // Fire the change event — on unfixed code, saveFiles() will await upload
    // and state will NOT be updated until upload resolves (never)
    fireEvent.change(imageFileInput, { target: { files: [file] } })

    // IMMEDIATELY assert a blob URL or object URL appears in an img element
    // (before upload resolves). On fixed code, the component creates a
    // URL.createObjectURL(file) immediately and shows it; on unfixed code, nothing changes.
    const imgElements = document.querySelectorAll('img')
    const previewImg = Array.from(imgElements).find(
      (img) => img.src.startsWith('blob:') || img.src.startsWith('data:')
    )

    // This assertion FAILS on unfixed code: no blob URL preview is shown
    expect(previewImg, 'An <img> with a blob: or data: preview URL should appear immediately').toBeTruthy()
    expect(previewImg.src).toMatch(/^blob:|^data:/)
  })
})

// ---------------------------------------------------------------------------
// Suite 2 — AdminLocationModal: gallery upload preview
// ---------------------------------------------------------------------------
describe('Bug 2 — AdminLocationModal: gallery thumbnails appear immediately on file select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show 2 gallery thumbnail elements immediately after selecting 2 files — FAILS on unfixed code', async () => {
    /**
     * Validates: Bug #1 (gallery kind) — saveFiles() awaits upload before appending
     * to gallery array, so no thumbnails appear until upload finishes (never).
     */
    renderWithRouter(
      <AdminLocationModal
        open={true}
        location={null}
        allLocations={[]}
        allowedCategories={['utility', 'tourism']}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // The gallery section has a multi-file input
    const fileInputs = document.querySelectorAll('input[type="file"]')
    const galleryInput = Array.from(fileInputs).find(
      (input) => input.multiple && input.accept === 'image/*'
    )
    expect(galleryInput, 'Gallery multi-file input should exist').toBeTruthy()

    const file1 = makeFile('gallery1.jpg', 'image/jpeg', 1024)
    const file2 = makeFile('gallery2.jpg', 'image/jpeg', 1024)

    fireEvent.change(galleryInput, { target: { files: [file1, file2] } })

    // Immediately query for blob URL images in the gallery grid
    // On fixed code: 2 thumbnail <img>s with blob: URLs appear right away.
    // On unfixed code: 0 thumbnails — state is not updated until upload resolves.
    const allImages = document.querySelectorAll('img')
    const blobImages = Array.from(allImages).filter(
      (img) => img.src.startsWith('blob:') || img.src.startsWith('data:')
    )

    // This assertion FAILS on unfixed code: blobImages.length === 0, not 2
    expect(blobImages.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Suite 3 — AdminPage: slide upload preview
// ---------------------------------------------------------------------------
describe('Bug 3 — AdminPage: slide image preview appears immediately on file select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams({ tab: 'slides' })
  })

  it('should update slide image src to a blob URL immediately after file input change — FAILS on unfixed code', async () => {
    /**
     * Validates: Bug #2 — AdminPage.uploadSlide() awaits uploadMedia() before
     * calling updateSlide(), so the slide image preview never updates during the upload.
     */
    renderWithRouter(<AdminPage mode="admin" />)

    // Confirm the slides tab is visible
    const heading = screen.queryByText(/slide ảnh chính/i)
    expect(heading, 'Slides tab heading should be visible').toBeTruthy()

    // Find the file input inside the slide card (for slide index 0)
    const slideFileInputs = document.querySelectorAll('input[type="file"][accept="image/*"]')
    const slideFileInput = slideFileInputs[0]
    expect(slideFileInput, 'Slide file input should exist').toBeTruthy()

    const file = makeFile('new-slide.jpg', 'image/jpeg', 3072)
    fireEvent.change(slideFileInput, { target: { files: [file] } })

    // The slide's <img> src should update to a blob URL immediately
    // On unfixed code: src stays as the old URL ('https://example.com/old-slide.jpg')
    const imgElements = document.querySelectorAll('img')
    const blobSlideImg = Array.from(imgElements).find(
      (img) => img.src.startsWith('blob:') || img.src.startsWith('data:')
    )

    // This assertion FAILS on unfixed code: no blob URL image is found
    expect(blobSlideImg, 'Slide <img> should show a blob: preview URL immediately').toBeTruthy()
    expect(blobSlideImg.src).toMatch(/^blob:|^data:/)
  })
})

// ---------------------------------------------------------------------------
// Suite 4 — AdminPage: footer logo has a file upload button
// ---------------------------------------------------------------------------
describe('Bug 4 — AdminPage footer: logo field should have a file input button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams({ tab: 'footer' })
  })

  it('should render an <input type="file"> near the logo URL field — FAILS on unfixed code', () => {
    /**
     * Validates: Bug #3 — The "URL logo tùy chỉnh" field in the footer tab only has
     * a text input. There is no <input type="file"> for uploading a logo from disk.
     * On fixed code, a file input button should exist in that section.
     */
    renderWithRouter(<AdminPage mode="admin" />)

    // Confirm footer tab is rendered
    const heading = screen.queryByText(/nội dung footer/i)
    expect(heading, 'Footer tab heading should be visible').toBeTruthy()

    // Look for any file input anywhere in the footer section
    // On fixed code: there will be an <input type="file" accept="image/*"> near the logo field
    // On unfixed code: no file input exists in this section
    const fileInputsInPage = document.querySelectorAll('input[type="file"]')

    // This assertion FAILS on unfixed code: 0 file inputs found in footer tab
    expect(
      fileInputsInPage.length,
      'Footer tab should contain at least one <input type="file"> for logo upload'
    ).toBeGreaterThan(0)
  })
})
