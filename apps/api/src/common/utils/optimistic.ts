import { ConflictException, NotFoundException } from '@nestjs/common';

interface Versioned {
  version: number;
}

/**
 * Shared optimistic-locking decision used by every module's update flow.
 * Given the current row (or null) and the version the client last read,
 * throws the right error before the guarded write is attempted.
 */
export function assertUpdatable(
  current: Versioned | null,
  expectedVersion: number,
  entity: string,
): asserts current is Versioned {
  if (!current) throw new NotFoundException(`${entity} not found`);
  if (current.version !== expectedVersion) {
    throw new ConflictException(
      `${entity} was modified by someone else (expected version ${expectedVersion}, current ${current.version}). Reload and try again.`,
    );
  }
}

/** Throws when the guarded write matched no row (a concurrent update slipped in). */
export function assertWritten(count: number, entity: string): void {
  if (count === 0) {
    throw new ConflictException(
      `${entity} was modified concurrently. Reload and try again.`,
    );
  }
}
