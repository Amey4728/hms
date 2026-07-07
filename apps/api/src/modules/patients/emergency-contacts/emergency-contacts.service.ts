import { Injectable, NotFoundException } from '@nestjs/common';
import type { EmergencyContact } from '@prisma/client';
import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '@hms/shared';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { PatientsService } from '../patients.service';
import { EmergencyContactsRepository } from './emergency-contacts.repository';

@Injectable()
export class EmergencyContactsService {
  constructor(
    private readonly repo: EmergencyContactsRepository,
    private readonly patients: PatientsService,
  ) {}

  async create(
    patientId: string,
    input: CreateEmergencyContactInput,
    userId: string,
  ): Promise<EmergencyContact> {
    await this.patients.assertPatientExists(patientId);
    return this.repo.create({
      ...input,
      patient: { connect: { id: patientId } },
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async list(patientId: string): Promise<EmergencyContact[]> {
    await this.patients.assertPatientExists(patientId);
    return this.repo.findByPatient(patientId);
  }

  async update(
    patientId: string,
    id: string,
    input: UpdateEmergencyContactInput,
    userId: string,
  ): Promise<EmergencyContact> {
    const { version, ...changes } = input;
    const current = await this.repo.findOne(patientId, id);
    assertUpdatable(current, version, 'Emergency contact');

    const count = await this.repo.updateGuarded(patientId, id, version, {
      ...changes,
      updatedBy: userId,
    });
    assertWritten(count, 'Emergency contact');
    return this.repo.findOne(patientId, id) as Promise<EmergencyContact>;
  }

  async remove(patientId: string, id: string, userId: string): Promise<{ id: string }> {
    const current = await this.repo.findOne(patientId, id);
    if (!current) throw new NotFoundException('Emergency contact not found');
    await this.repo.softDelete(patientId, id, userId);
    return { id };
  }
}
