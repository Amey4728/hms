import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Hospital } from '@prisma/client';
import { HospitalsService } from './hospitals.service';
import type { HospitalsRepository } from './hospitals.repository';

function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
    id: 'h1',
    name: 'General',
    code: 'GEN',
    licenseNumber: null,
    email: null,
    phone: null,
    addressLine: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    isActive: true,
    version: 3,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('HospitalsService', () => {
  let repo: jest.Mocked<HospitalsRepository>;
  let service: HospitalsService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findActiveById: jest.fn(),
      findManyPaginated: jest.fn(),
      updateGuarded: jest.fn(),
      softDelete: jest.fn(),
      hasActiveChildren: jest.fn(),
    } as unknown as jest.Mocked<HospitalsRepository>;
    service = new HospitalsService(repo);
  });

  describe('update', () => {
    it('throws NotFound when the hospital does not exist', async () => {
      repo.findActiveById.mockResolvedValue(null);
      await expect(service.update('h1', { version: 3 }, 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Conflict on a stale version (optimistic lock)', async () => {
      repo.findActiveById.mockResolvedValue(makeHospital({ version: 5 }));
      await expect(
        service.update('h1', { version: 3, name: 'New' }, 'u1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.updateGuarded).not.toHaveBeenCalled();
    });

    it('writes with the version guard and returns the refreshed row', async () => {
      repo.findActiveById
        .mockResolvedValueOnce(makeHospital({ version: 3 }))
        .mockResolvedValueOnce(makeHospital({ version: 4, name: 'New' }));
      repo.updateGuarded.mockResolvedValue(1);

      const result = await service.update('h1', { version: 3, name: 'New' }, 'u1');

      expect(repo.updateGuarded).toHaveBeenCalledWith('h1', 3, { name: 'New', updatedBy: 'u1' });
      expect(result.version).toBe(4);
    });
  });

  describe('remove', () => {
    it('blocks deletion when active children exist', async () => {
      repo.findActiveById.mockResolvedValue(makeHospital());
      repo.hasActiveChildren.mockResolvedValue(true);
      await expect(service.remove('h1', 'u1')).rejects.toBeInstanceOf(ConflictException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes when there are no children', async () => {
      repo.findActiveById.mockResolvedValue(makeHospital());
      repo.hasActiveChildren.mockResolvedValue(false);
      repo.softDelete.mockResolvedValue({ count: 1 });
      await expect(service.remove('h1', 'u1')).resolves.toEqual({ id: 'h1' });
      expect(repo.softDelete).toHaveBeenCalledWith('h1', 'u1');
    });
  });
});
