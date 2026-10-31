import { describe, it, expect } from 'vitest';
import { addMonths } from '@/domain/month';

describe('addMonths', () => {
  it('연도를 넘어간다', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-03', -1)).toBe('2026-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
});
