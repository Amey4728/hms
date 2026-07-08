import { Injectable, NotFoundException } from '@nestjs/common';
import type { RadiologyStatus } from '@prisma/client';
import type {
  CancelStudyInput,
  CreateStudyInput,
  ReportStudyInput,
  ScheduleStudyInput,
} from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { HospitalsRepository } from '../../hospitals/hospitals.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { ExamsRepository } from '../exams/exams.repository';
import { toStudyView } from '../radiology.mapper';
import { assertStudyTransition } from './studies.state';
import { StudiesRepository } from './studies.repository';

interface StudyQuery {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  patientId?: string;
  status?: RadiologyStatus;
}

@Injectable()
export class StudiesService {
  constructor(
    private readonly repo: StudiesRepository,
    private readonly exams: ExamsRepository,
    private readonly patients: PatientsRepository,
    private readonly hospitals: HospitalsRepository,
  ) {}

  async create(input: CreateStudyInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId)))
      throw new NotFoundException('Patient not found');
    if (!(await this.hospitals.findActiveById(input.hospitalId)))
      throw new NotFoundException('Hospital not found');
    if (!(await this.exams.findActiveById(input.examId)))
      throw new NotFoundException('Exam not found');
    const study = await this.repo.create({
      patientId: input.patientId,
      hospitalId: input.hospitalId,
      examId: input.examId,
      referredById: input.referredById,
      createdBy: userId,
      updatedBy: userId,
    });
    return toStudyView(study);
  }

  async findById(id: string) {
    const study = await this.repo.findWithRefs(id);
    if (!study) throw new NotFoundException('Study not found');
    return toStudyView(study);
  }

  async list(query: StudyQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      status: query.status,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toStudyView), total, query.page, query.limit);
  }

  schedule(id: string, input: ScheduleStudyInput, userId: string) {
    return this.transition(id, input.version, 'SCHEDULED', userId, {
      scheduledAt: input.scheduledAt,
    });
  }

  perform(id: string, version: number, userId: string) {
    return this.transition(id, version, 'PERFORMED', userId, { performedAt: new Date() });
  }

  report(id: string, input: ReportStudyInput, userId: string) {
    return this.transition(id, input.version, 'REPORTED', userId, {
      reportedAt: new Date(),
      radiologistId: userId,
      findings: input.findings,
      impression: input.impression,
      imageUrl: input.imageUrl,
    });
  }

  cancel(id: string, input: CancelStudyInput, userId: string) {
    return this.transition(id, input.version, 'CANCELLED', userId, {
      cancelledAt: new Date(),
      cancellationReason: input.reason,
    });
  }

  private async transition(
    id: string,
    version: number,
    to: RadiologyStatus,
    userId: string,
    extra: Record<string, unknown>,
  ) {
    const current = await this.repo.findBareById(id);
    assertUpdatable(current, version, 'Study');
    assertStudyTransition(current.status, to);
    assertWritten(
      await this.repo.updateGuarded(id, version, { status: to, updatedBy: userId, ...extra }),
      'Study',
    );
    return this.findById(id);
  }
}
