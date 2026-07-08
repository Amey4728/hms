import { Injectable, NotFoundException } from '@nestjs/common';
import type { DoctorAvailability } from '@prisma/client';
import type { CreateAvailabilityInput, UpdateAvailabilityInput } from '@hms/shared';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { SchedulingValidationService } from '../scheduling-validation.service';
import { AvailabilityRepository } from './availability.repository';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly repo: AvailabilityRepository,
    private readonly validate: SchedulingValidationService,
  ) {}

  async create(input: CreateAvailabilityInput, userId: string): Promise<DoctorAvailability> {
    const { doctorId, hospitalId, branchId, departmentId, ...rest } = input;
    await this.validate.assertActiveDoctor(doctorId);
    await this.validate.assertScope(hospitalId, branchId, departmentId);

    return this.repo.create({
      ...rest,
      doctor: { connect: { id: doctorId } },
      hospital: { connect: { id: hospitalId } },
      ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      ...(departmentId ? { department: { connect: { id: departmentId } } } : {}),
      createdBy: userId,
      updatedBy: userId,
    });
  }

  listByDoctor(doctorId: string): Promise<DoctorAvailability[]> {
    return this.repo.findByDoctor(doctorId);
  }

  async update(
    id: string,
    input: UpdateAvailabilityInput,
    userId: string,
  ): Promise<DoctorAvailability> {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Availability');

    const count = await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId });
    assertWritten(count, 'Availability');
    return this.repo.findActiveById(id) as Promise<DoctorAvailability>;
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const current = await this.repo.findActiveById(id);
    if (!current) throw new NotFoundException('Availability not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }
}
