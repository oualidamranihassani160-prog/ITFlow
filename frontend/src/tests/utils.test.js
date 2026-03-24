import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatRelativeTime, formatDate, getInitials, cn } from '../utils/helpers'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-21T12:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('returns "just now" for very recent dates', () => {
    const date = new Date('2026-03-21T11:59:45Z').toISOString()
    expect(formatRelativeTime(date)).toBe('just now')
  })

  it('returns minutes ago for dates within the hour', () => {
    const date = new Date('2026-03-21T11:30:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('30m ago')
  })

  it('returns hours ago for dates within the day', () => {
    const date = new Date('2026-03-21T09:00:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('3h ago')
  })

  it('returns days ago for dates within the week', () => {
    const date = new Date('2026-03-19T12:00:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('2d ago')
  })

  it('returns formatted date for older dates', () => {
    const date = new Date('2026-03-01T12:00:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('Mar 1')
  })

  it('returns empty string for falsy input', () => {
    expect(formatRelativeTime(null)).toBe('')
    expect(formatRelativeTime(undefined)).toBe('')
    expect(formatRelativeTime('')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats date string correctly', () => {
    expect(formatDate('2026-03-21')).toMatch(/Mar 21, 2026/)
  })

  it('returns em dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('returns at most 2 initials', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('returns ? for empty/null input', () => {
    expect(getInitials(null)).toBe('?')
    expect(getInitials('')).toBe('?')
    expect(getInitials(undefined)).toBe('?')
  })

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters out falsy values', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar')
  })

  it('returns empty string when all falsy', () => {
    expect(cn(null, undefined, false)).toBe('')
  })
})
