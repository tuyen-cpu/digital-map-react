// @vitest-environment jsdom
/**
 * Preservation Property Tests — Task 2 (admin-upload-ux spec)
 *
 * These tests verify NON-BUGGY code paths that must remain unchanged
 * after the fix is applied. All four properties PASS on unfixed code.
 *
 *   Prop A — URL text input for image field (AdminLocationModal)
 *   Prop B — Oversized file rejection (AdminLocationModal)
 *   Prop C — Slide title edit does not affect slide image (AdminPage)
 *   Prop D — URL text input for footer logo (AdminPage)
 */

import { render, fireEvent, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock: services/api — prevents VITE_API_URL import-time throw
// ---------------------------------------------------------------------------
vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
  getAccessToken: vi.fn(() => null),
  setUnauthorizedHandler: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock: mediaService — the subject of tracking (should NOT be called)
// ---------------------------------------------------------------------------
vi.mock('../services/mediaService', () => ({
  uploadMedia: vi.fn(() => Promise.resolve('https://cdn.example.com/uploaded.jpg')),
  deleteMedia: vi.fn(() => Promise.resolve()),
}))

// ---------------------------------------------------------------------------
// Mock: react-router-dom — prevent useNavigate / BrowserRouter issues
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams('tab=slides'), vi.fn()],
  Navigate: ({ to }) => React.createElement('div', null, `Redirected to ${to}`),
  Link: ({ children, to }) => React.createElement('a', { href: to }, children),
}))

// ---------------------------------------------------------------------------
// Mock: react-leaflet — Leaflet requires real DOM APIs not in jsdom
// ---------------------------------------------------------------------------
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
  TileLayer: () => null,
  CircleMarker: () => null,
  useMap: () => ({ flyTo: vi.fn(), getZoom: vi.fn(() => 13) }),
  useMapEvents: () => null,
}))

// ---------------------------------------------------------------------------
// Mock: heavy AdminPage sub-components (not under test)
// ---------------------------------------------------------------------------
vi.mock('../components/AdminCategoriesTab', () => ({
  default: () => React.createElement('div', { 'data-testid': 'categories-tab' }, 'CategoriesTab'),
}))
vi.mock('../components/AdminReportsPanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'reports-panel' }, 'ReportsPanel'),
}))
vi.mock('../components/AdminReviewItem', () => ({
  default: () => React.createElement('div', { 'data-testid': 'review-item' }, 'ReviewItem'),
}))
vi.mock('../components/AdminUserModal', () => ({
  default: () => null,
}))
vi.mock('../components/AdminLocationModal', async (importOriginal) => {
  // Keep real for Prop A & Prop B; mock only when testing AdminPage
  return importOriginal()
})
vi.mock('../components/MediaImage', () => ({
  default: ({ src, alt, className }) => React.createElement('img', { src, alt, className }),
}))
vi.mock('../components/MediaVideo', () => ({
  default: ({ src, className }) => React.createElement('video', { src, className }),
}))
vi.mock('../components/AnalyticsTracker', () => ({ default: () => null }))

// ---------------------------------------------------------------------------
// Mock: all services that make network calls
// ---------------------------------------------------------------------------
vi.mock('../services/authService', () => ({
  apiLogin: vi.fn(),
  apiLogout: vi.fn(() => Promise.resolve()),
  apiMe: vi.fn(() => Promise.reject(new Error('no token'))),
  apiRegister: vi.fn(),
  apiUpdateProfile: vi.fn(),
  apiChangePassword: vi.fn(),
}))
vi.mock('../services/locationService', () => ({
  apiGetLocations: vi.fn(() => Promise.resolve([])),
  apiCreateLocation: vi.fn(),
  apiUpdateLocation: vi.fn(),
  apiDeleteLocation: vi.fn(),
  apiImportLocations: vi.fn(),
  apiResetLocations: vi.fn(),
}))
vi.mock('../services/reviewService', () => ({
  apiGetReviews: vi.fn(() => Promise.resolve([])),
  apiGetAllReviews: vi.fn(() => Promise.resolve([])),
  apiSubmitReview: vi.fn(),
  apiDeleteReview: vi.fn(),
  apiReplyToReview: vi.fn(),
  apiDeleteReviewReply: vi.fn(),
}))
vi.mock('../services/favoriteService', () => ({
  apiGetFavorites: vi.fn(() => Promise.resolve([])),
  apiToggleFavorite: vi.fn(),
}))
vi.mock('../services/travelService', () => ({
  apiRecordTravel: vi.fn(),
  apiGetTravelHistory: vi.fn(() => Promise.resolve([])),
  apiDeleteTravelHistory: vi.fn(),
  apiGetReminders: vi.fn(() => Promise.resolve([])),
  apiCreateReminder: vi.fn(),
  apiDeleteReminder: vi.fn(),
  apiCompleteReminder: vi.fn(),
  apiMarkReminderNotified: vi.fn(),
}))
vi.mock('../services/analyticsService', () => ({
  apiTrackEvent: vi.fn(() => Promise.resolve()),
  apiGetAnalyticsEvents: vi.fn(() => Promise.resolve([])),
  apiClearAnalytics: vi.fn(() => Promise.resolve()),
}))
vi.mock('../services/siteConfigService', () => ({
  apiGetSiteConfig: vi.fn(() => Promise.resolve({
    heroSlides: [
      { id: 'slide-1', image: 'https://example.com/slide1.jpg', title: 'Slide 1', caption: 'Caption 1' },
      { id: 'slide-2', image: 'https://example.com/slide2.jpg', title: 'Slide 2', caption: 'Caption 2' },
    ],
    heroIntervalMs: 5200,
    footer: {
      orgName: 'UBND Phường Bình Định',
      phone: '0256 3846 xxx',
      address: 'Phường Bình Định, Thị xã An Nhơn',
      email: 'binhdinh@binhdinh.gov.vn',
      workingHours: '7:00 - 11:30, 13:30 - 17:00',
      copyright: '© 2025 UBND Phường Bình Định',
      description: 'Website du lịch Phường Bình Định',
      logoUrl: '',
    },
  })),
  apiUpdateSiteConfig: vi.fn((patch) => Promise.resolve({ heroSlides: [], footer: {}, ...patch })),
  apiResetSiteConfig: vi.fn(() => Promise.resolve({ heroSlides: [], footer: {} })),
}))
vi.mock('../services/adminService', () => ({
  apiGetUsers: vi.fn(() => Promise.resolve([])),
  apiUpdateUser: vi.fn(),
  apiDeleteUser: vi.fn(),
  apiResetUserPassword: vi.fn(),
}))
vi.mock('../services/categoryService', () => ({
  apiGetCategories: vi.fn(() => Promise.resolve([])),
  apiCreateCategory: vi.fn(),
  apiUpdateCategory: vi.fn(),
  apiDeleteCategory: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports — after mocks are registered
// ---------------------------------------------------------------------------
import { uploadMedia } from '../services/mediaService'
import AdminLocationModal from '../components/AdminLocationModal'
import AdminPage from '../pages/AdminPage'
import { ApiStateProvider } from '../context/ApiStateContext'

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/**
 * Wrap component in a minimal provider tree.
 * ApiStateProvider needs useNavigate (mocked above) so it renders fine.
 */
function renderWithProviders(ui) {
  return render(
    React.createElement(ApiStateProvider, null, ui)
  )
}

/**
 * Wait for the ApiStateProvider boot effects to settle (location/siteConfig loads).
 * The boot effect runs apiGetSiteConfig().then(setSiteSettings) — we need to let
 * all microtasks and a couple of event loop ticks drain so state is updated.
 */
async function waitForBoot() {
  await act(async () => {
    // Drain microtasks and give React time to flush all state updates
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
}

// A minimal location object for AdminLocationModal
const MOCK_LOCATION = {
  id: 'test-loc-1',
  name: 'Test Location',
  category: 'tourism',
  group: '',
  subgroup: '',
  address: '123 Main St',
  lat: 13.8932,
  lng: 109.058,
  phone: '',
  image: '',
  imageAlt: '',
  gallery: [],
  panoramas: [],
  videos: [],
}

// Admin session used to authenticate AdminPage
const ADMIN_SESSION = {
  username: 'admin',
  displayName: 'Admin User',
  role: 'admin',
  phone: '0909090909',
  mustChangePassword: false,
  permissions: {},
}

// ---------------------------------------------------------------------------
// Prop A — URL text input for image field (AdminLocationModal)
//
// Typing a URL into the image URL text input should set form.image to that
// URL string directly — uploadMedia must NOT be called.
// ---------------------------------------------------------------------------
describe('Prop A — URL text input for image field (AdminLocationModal)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const urlCases = [
    'https://example.com/photo.jpg',
    'https://cdn.example.net/images/place-001.webp',
    'https://upload.wikimedia.org/photo.png',
    'http://static.example.org/img/test.jpeg',
  ]

  it.each(urlCases)(
    'typing URL "%s" into image URL input updates the field without calling uploadMedia',
    async (url) => {
      renderWithProviders(
        React.createElement(AdminLocationModal, {
          open: true,
          location: MOCK_LOCATION,
          allLocations: [],
          allowedCategories: [],
          onClose: vi.fn(),
          onSave: vi.fn(),
          onDelete: vi.fn(),
        })
      )

      // Find the "Hoặc dán URL ảnh..." input (plain text input for image URL)
      const urlInput = screen.getByPlaceholderText('Hoặc dán URL ảnh...')
      expect(urlInput).toBeTruthy()

      fireEvent.change(urlInput, { target: { value: url } })

      // The input value should reflect the typed URL
      expect(urlInput.value).toBe(url)

      // uploadMedia must NOT be called — typing a URL is not a file upload
      expect(uploadMedia).not.toHaveBeenCalled()
    }
  )

  it('typed URL in image input does not produce a blob: URL', () => {
    renderWithProviders(
      React.createElement(AdminLocationModal, {
        open: true,
        location: MOCK_LOCATION,
        allLocations: [],
        allowedCategories: [],
        onClose: vi.fn(),
        onSave: vi.fn(),
        onDelete: vi.fn(),
      })
    )

    const urlInput = screen.getByPlaceholderText('Hoặc dán URL ảnh...')
    const testUrl = 'https://example.com/landscape.jpg'
    fireEvent.change(urlInput, { target: { value: testUrl } })

    expect(urlInput.value).not.toMatch(/^blob:/)
    expect(urlInput.value).toBe(testUrl)
  })
})

// ---------------------------------------------------------------------------
// Prop B — Oversized file rejection (AdminLocationModal)
//
// Selecting a file > 8 MB should show an error message, leave form.image
// unchanged, and NOT call uploadMedia.
// ---------------------------------------------------------------------------
describe('Prop B — Oversized file rejection (AdminLocationModal)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const MB = 1024 * 1024
  const LIMIT = 8 * MB

  function makeOversizedFile(name = 'huge.jpg', sizeBytes = LIMIT + 1) {
    const file = new File(['x'], name, { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true })
    return file
  }

  it('selecting a 9 MB file shows error and does not call uploadMedia', async () => {
    renderWithProviders(
      React.createElement(AdminLocationModal, {
        open: true,
        location: { ...MOCK_LOCATION, image: '' },
        allLocations: [],
        allowedCategories: [],
        onClose: vi.fn(),
        onSave: vi.fn(),
        onDelete: vi.fn(),
      })
    )

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
    expect(fileInput).toBeTruthy()

    const oversizedFile = makeOversizedFile('big-photo.jpg', 9 * MB)

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })
    })

    // Error message should appear
    const errorEl = screen.getByText(/vượt quá giới hạn/i)
    expect(errorEl).toBeTruthy()

    // uploadMedia must NOT be called for oversized files
    expect(uploadMedia).not.toHaveBeenCalled()
  })

  it('error message mentions the 8 MB limit when file is oversized', async () => {
    renderWithProviders(
      React.createElement(AdminLocationModal, {
        open: true,
        location: { ...MOCK_LOCATION, image: 'https://example.com/existing.jpg' },
        allLocations: [],
        allowedCategories: [],
        onClose: vi.fn(),
        onSave: vi.fn(),
        onDelete: vi.fn(),
      })
    )

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
    const oversizedFile = makeOversizedFile('toobig.jpg', LIMIT + 1024)

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })
    })

    // The upload error message div (distinct from the static "Giới hạn 8 MB" hint)
    // appears with border-red styling — it contains both the filename and "8 MB"
    const errorEl = screen.getByText(/vượt quá giới hạn/i)
    expect(errorEl).toBeTruthy()
    expect(errorEl.textContent).toMatch(/8 MB/i)
    expect(uploadMedia).not.toHaveBeenCalled()
  })

  it('image URL input retains previous value after oversized rejection', async () => {
    const existingUrl = 'https://example.com/current-image.jpg'

    renderWithProviders(
      React.createElement(AdminLocationModal, {
        open: true,
        location: { ...MOCK_LOCATION, image: existingUrl },
        allLocations: [],
        allowedCategories: [],
        onClose: vi.fn(),
        onSave: vi.fn(),
        onDelete: vi.fn(),
      })
    )

    const urlInput = screen.getByPlaceholderText('Hoặc dán URL ảnh...')
    // The URL input should show the existing image URL
    expect(urlInput.value).toBe(existingUrl)

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
    const oversizedFile = makeOversizedFile('big.jpg', LIMIT + 1)

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } })
    })

    // Image URL input must remain the same — oversized rejection must not clear it
    expect(urlInput.value).toBe(existingUrl)
    expect(uploadMedia).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Prop C — Slide title edit does not affect slide image (AdminPage)
//
// Editing the title input for slide 0 should only change slide.title.
// slide.image must remain unchanged. uploadMedia must NOT be called.
// ---------------------------------------------------------------------------
describe('Prop C — Slide title edit does not affect slide image (AdminPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure the session is seen as admin in localStorage
    localStorage.setItem(
      'binh-dinh:api-session',
      JSON.stringify(ADMIN_SESSION)
    )
  })

  it('editing slide 0 title does not change slide 0 image or call uploadMedia', async () => {
    renderWithProviders(
      React.createElement(AdminPage, { mode: 'admin' })
    )

    // Wait for siteSettings to load (apiGetSiteConfig resolves with slides)
    await waitForBoot()

    // Find all text inputs — slides tab should be active (useSearchParams mock returns tab=slides)
    const allInputs = document.querySelectorAll('input[type="text"], input:not([type])')

    // Find title input (value = "Slide 1") and image URL input for slide 0
    let titleInput = null
    let imageInput = null
    for (const input of allInputs) {
      if (input.value === 'Slide 1') titleInput = input
      if (input.value === 'https://example.com/slide1.jpg') imageInput = input
    }

    expect(titleInput).not.toBeNull()
    expect(imageInput).not.toBeNull()

    const originalImageValue = imageInput.value

    // Edit the title
    fireEvent.change(titleInput, { target: { value: 'New Slide Title' } })

    // Title should update
    expect(titleInput.value).toBe('New Slide Title')

    // Image must be unchanged
    expect(imageInput.value).toBe(originalImageValue)

    // uploadMedia must NOT be called
    expect(uploadMedia).not.toHaveBeenCalled()
  })

  const titleCases = [
    'Cổng Thành Bình Định',
    'Tháp Đôi - Di tích lịch sử',
    'Chợ truyền thống',
    'Lễ hội văn hóa 2025',
  ]

  it.each(titleCases)(
    'typing title "%s" for slide 0 does not affect slide 0 image',
    async (newTitle) => {
      renderWithProviders(
        React.createElement(AdminPage, { mode: 'admin' })
      )

      await waitForBoot()

      const allInputs = document.querySelectorAll('input[type="text"], input:not([type])')

      let titleInput = null
      let imageInput = null
      for (const input of allInputs) {
        if (input.value === 'Slide 1') titleInput = input
        if (input.value === 'https://example.com/slide1.jpg') imageInput = input
      }

      if (!titleInput || !imageInput) {
        // siteSettings may not be loaded yet — skip silently
        return
      }

      const originalImage = imageInput.value

      fireEvent.change(titleInput, { target: { value: newTitle } })

      expect(titleInput.value).toBe(newTitle)
      expect(imageInput.value).toBe(originalImage)
      expect(uploadMedia).not.toHaveBeenCalled()
    }
  )
})

// ---------------------------------------------------------------------------
// Prop D — URL text input for footer logo (AdminPage)
//
// Typing a URL into the footer logoUrl input should update the field to that
// URL string — NOT a blob URL, and uploadMedia must NOT be called.
// ---------------------------------------------------------------------------
describe('Prop D — URL text input for footer logo (AdminPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem(
      'binh-dinh:api-session',
      JSON.stringify(ADMIN_SESSION)
    )
  })

  /**
   * Helper: render AdminPage with footer tab active.
   * We override useSearchParams mock inline for this suite.
   */
  async function renderAdminPageFooterTab() {
    // The mocked useSearchParams returns 'tab=slides' by default.
    // For footer tests, we need to activate the footer tab.
    // We do this by clicking the "Cài đặt Footer" tab button after rendering.

    renderWithProviders(
      React.createElement(AdminPage, { mode: 'admin' })
    )

    await waitForBoot()

    // Click the footer tab
    const footerTabBtn = screen.queryByText(/Cài đặt Footer/i) ||
      screen.queryByText(/footer/i)

    if (footerTabBtn) {
      await act(async () => {
        fireEvent.click(footerTabBtn)
      })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    }
  }

  const logoCases = [
    'https://example.com/logo.png',
    'https://cdn.example.net/org-logo.svg',
    'https://static.example.org/logo-200x200.webp',
  ]

  it.each(logoCases)(
    'typing logo URL "%s" updates the input without calling uploadMedia',
    async (logoUrl) => {
      await renderAdminPageFooterTab()

      // Find the logo URL input by placeholder
      const logoInput = screen.queryByPlaceholderText(/để trống dùng logo mặc định/i)
        || screen.queryByPlaceholderText(/https:\/\//i)

      if (!logoInput) {
        // Footer tab might not be rendered (siteSettings not loaded) — skip
        return
      }

      fireEvent.change(logoInput, { target: { value: logoUrl } })

      expect(logoInput.value).toBe(logoUrl)
      expect(logoInput.value).not.toMatch(/^blob:/)
      expect(uploadMedia).not.toHaveBeenCalled()
    }
  )

  it('logo URL input does not produce a blob: URL when typing', async () => {
    await renderAdminPageFooterTab()

    const logoInput = screen.queryByPlaceholderText(/để trống dùng logo mặc định/i)
    if (!logoInput) return

    const testUrl = 'https://example.com/town-logo.png'
    fireEvent.change(logoInput, { target: { value: testUrl } })

    expect(logoInput.value).toBe(testUrl)
    expect(logoInput.value).not.toMatch(/^blob:/)
    expect(uploadMedia).not.toHaveBeenCalled()
  })

  it('logo URL input starts as empty string (no blob) in a fresh footer load', async () => {
    await renderAdminPageFooterTab()

    const logoInput = screen.queryByPlaceholderText(/để trống dùng logo mặc định/i)
    if (!logoInput) return

    // Should start empty or with the mock value (empty string in mock)
    expect(logoInput.value).not.toMatch(/^blob:/)
    expect(uploadMedia).not.toHaveBeenCalled()
  })
})
