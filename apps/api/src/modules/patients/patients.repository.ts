import { Injectable } from '@nestjs/common';
import { Prisma, type Gender, type Patient, type PatientStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Include that pulls the active child collections for the full profile view. */
const patientProfileInclude = Prisma.validator<Prisma.PatientInclude>()({
  emergencyContacts: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
  allergies: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
  medicalHistories: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
});
export type PatientProfile = Prisma.PatientGetPayload<{ include: typeof patientProfileInclude }>;

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({ data });
  }

  findActiveById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findFirst({ where: { id, deletedAt: null } });
  }

  findProfileById(id: string): Promise<PatientProfile | null> {
    return this.prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: patientProfileInclude,
    });
  }

  async existsActive(id: string): Promise<boolean> {
    const count = await this.prisma.patient.count({ where: { id, deletedAt: null } });
    return count > 0;
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    hospitalId?: string;
    status?: PatientStatus;
    gender?: Gender;
    search?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Patient[]; total: number }> {
    const search = params.search?.trim();
    const asPatientNumber = search && /^\d+$/.test(search) ? Number(search) : undefined;

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(params.hospitalId ? { hospitalId: params.hospitalId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.gender ? { gender: params.gender } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { nationalId: { contains: search, mode: 'insensitive' } },
              ...(asPatientNumber !== undefined ? [{ patientNumber: asPatientNumber }] : []),
            ],
          }
        : {}),
    };

    const sortable = new Set(['createdAt', 'updatedAt', 'lastName', 'firstName', 'dateOfBirth', 'patientNumber']);
    const orderBy: Prisma.PatientOrderByWithRelationInput =
      params.sortBy && sortable.has(params.sortBy)
        ? { [params.sortBy]: params.sortOrder }
        : { createdAt: params.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      this.prisma.patient.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.PatientUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.patient.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.patient.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
