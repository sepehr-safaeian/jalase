import { describe, expect, it } from 'vitest';
import {
  getAdapterById,
  getAdapterForUrl,
  getAllHostPatterns,
  googleMeetAdapter,
} from './registry';

describe('platform registry', () => {
  it('finds Google Meet adapter by URL', () => {
    const adapter = getAdapterForUrl('https://meet.google.com/abc-defg-hij');
    expect(adapter?.id).toBe('google_meet');
  });

  it('returns null for unknown URLs', () => {
    expect(getAdapterForUrl('https://example.com')).toBeNull();
  });

  it('gets adapter by id', () => {
    expect(getAdapterById('google_meet')).toBe(googleMeetAdapter);
  });

  it('lists host patterns for all platforms', () => {
    const patterns = getAllHostPatterns();
    expect(patterns).toContain('https://meet.google.com/*');
    expect(patterns.length).toBeGreaterThan(1);
  });
});
