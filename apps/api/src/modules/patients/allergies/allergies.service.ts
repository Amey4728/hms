import { Injectable, NotFoundException } from '@nestjs/common';
import type { Allergy } from '@prisma/client';
import type { CreateAllergyInput, UpdateAllergyInput } from '@hms/shared';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { PatientsService } from '../patients.service';
import { AllergiesRepository } from './allergies.repository';

@Injectable()
export class AllergiesService {
  constructor(
    private readonly repo: AllergiesRepository,
    private readonly patients: PatientsService,
  ) {}

  async create(patientId: string, input: CreateAllergyInput, userId: string): Promise<Allergy> {
    await this.patients.assertPatientExists(patientId);
    return this.repo.create({
      ...input,
      patient: { connect: { id: patientId } },
      recordedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async list(patientId: string): Promise<Allergy[]> {
    await this.patients.assertPatientExists(patientId);
    return this.repo.findByPatient(patientId);
  }

  async update(
    patientId: string,
    id: string,
    input: UpdateAllergyInput,
    userId: string,
  ): Promise<Allergy> {
    const { version, ...changes } = input;
    const current = await this.repo.findOne(patientId, id);
    assertUpdatable(current, version, 'Allergy');

    const count = await this.repo.updateGuarded(patientId, id, version, {
      ...changes,
      updatedBy: userId,
    });
    assertWritten(count, 'Allergy');
    return this.repo.findOne(patientId, id) as Promise<Allergy>;
  }

  async remove(patientId: string, id: string, userId: string): Promise<{ id: string }> {
    const current = await this.repo.findOne(patientId, id);
    if (!current) throw new NotFoundException('Allergy not found');
    await this.repo.softDelete(patientId, id, userId);
    return { id };
  }
}
