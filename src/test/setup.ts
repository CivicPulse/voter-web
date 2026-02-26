import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Automatically cleanup after each test
afterEach(() => {
  cleanup()
})

// Global test utilities and mocks can be added here
// Example: Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock pointer capture for vaul drawer and Radix UI in jsdom
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
Element.prototype.scrollIntoView = vi.fn()

// Mock getComputedStyle for vaul drawer transform handling
const originalGetComputedStyle = globalThis.getComputedStyle
globalThis.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  const style = originalGetComputedStyle(elt, pseudoElt)
  if (!style.transform) {
    Object.defineProperty(style, 'transform', {
      value: 'none',
      writable: true,
    })
  }
  return style
}

// Mock IntersectionObserver for components that use it
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver
