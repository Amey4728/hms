import { ConflictException } from '@nestjs/common';
import { assertTransition, toDateOnly } from './appointment.state';

describe('appointment state machine', () => {
  it('allows the happy path BOOKED → CHECKED_IN → IN_PROGRESS → COMPLETED', () => {
    expect(() => assertTransition('BOOKED', 'CHECKED_IN')).not.toThrow();
    expect(() => assertTransition('CHECKED_IN', 'IN_PROGRESS')).not.toThrow();
    expect(() => assertTransition('IN_PROGRESS', 'COMPLETED')).not.toThrow();
  });

  it('allows cancellation from BOOKED and CHECKED_IN', () => {
    expect(() => assertTransition('BOOKED', 'CANCELLED')).not.toThrow();
    expect(() => assertTransition('CHECKED_IN', 'CANCELLED')).not.toThrow();
  });

  it('rejects illegal transitions', () => {
    expect(() => assertTransition('COMPLETED', 'IN_PROGRESS')).toThrow(ConflictException);
    expect(() => assertTransition('CANCELLED', 'CHECKED_IN')).toThrow(ConflictException);
    expect(() => assertTransition('BOOKED', 'COMPLETED')).toThrow(ConflictException);
    expect(() => assertTransition('IN_PROGRESS', 'CANCELLED')).toThrow(ConflictException);
  });

  it('truncates a timestamp to a UTC date-only value', () => {
    const d = toDateOnly(new Date('2026-07-07T15:42:11.000Z'));
    expect(d.toISOString()).toBe('2026-07-07T00:00:00.000Z');
  });
});
