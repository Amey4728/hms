import { Injectable, NotFoundException } from '@nestjs/common';
import type { MedicalHistory } from '@prisma/client';
import type { CreateMedicalHistoryInput, UpdateMedicalHistoryInput } from '@hms/shared';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { PatientsService } from '../patients.service';
import { MedicalHistoryRepository } from './medical-history.repository';

@Injectable()
export class MedicalHistoryService {
  constructor(
    private readonly repo: MedicalHistoryRepository,
    private readonly patients: PatientsService,
  ) {}

  async create(
    patientId: string,
    input: CreateMedicalHistoryInput,
    userId: string,
  ): Promise<MedicalHistory> {
    await this.patients.assertPatientExists(patientId);
    return this.repo.create({
      ...input,
      patient: { connect: { id: patientId } },
      recordedBy: userId,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async list(patientId: string): Promise<MedicalHistory[]> {
    await this.patients.assertPatientExists(patientId);
    return this.repo.findByPatient(patientId);
  }

  async update(
    patientId: string,
    id: string,
    input: UpdateMedicalHistoryInput,
    userId: string,
  ): Promise<MedicalHistory> {
    const { version, ...changes } = input;
    const current = await this.repo.findOne(patientId, id);
    assertUpdatable(current, version, 'Medical history entry');

    const count = await this.repo.updateGuarded(patientId, id, version, {
      ...changes,
      updatedBy: userId,
    });
    assertWritten(count, 'Medical history entry');
    return this.repo.findOne(patientId, id) as Promise<MedicalHistory>;
  }

  async remove(patientId: string, id: string, userId: string): Promise<{ id: string }> {
    const current = await this.repo.findOne(patientId, id);
    if (!current) throw new NotFoundException('Medical history entry not found');
    await this.repo.softDelete(patientId, id, userId);
    return { id };
  }
}
