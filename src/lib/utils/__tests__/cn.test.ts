import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', false && 'conditional', 'always')
    expect(result).toBe('base always')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle null and undefined', () => {
    const result = cn('base', null, undefined, 'end')
    expect(result).toBe('base end')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['base', 'flex'], 'items-center')
    expect(result).toBe('base flex items-center')
  })

  it('should resolve Tailwind conflicts', () => {
    // twMerge resolves conflicts - later classes win
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })
})
