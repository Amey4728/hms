import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LabOrderStatus } from '@prisma/client';
import type { CancelLabOrderInput, CreateLabOrderInput, EnterResultInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { HospitalsRepository } from '../../hospitals/hospitals.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { toLabOrderView } from '../lab.mapper';
import { LabTestsRepository } from '../lab-tests/lab-tests.repository';
import type { LabOrderQueryDto } from './lab-orders.dto';
import { assertLabTransition } from './lab-order.state';
import { LabOrdersRepository } from './lab-orders.repository';

@Injectable()
export class LabOrdersService {
  constructor(
    private readonly repo: LabOrdersRepository,
    private readonly tests: LabTestsRepository,
    private readonly patients: PatientsRepository,
    private readonly hospitals: HospitalsRepository,
  ) {}

  async create(input: CreateLabOrderInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId))) {
      throw new NotFoundException(`Patient ${input.patientId} not found`);
    }
    if (!(await this.hospitals.findActiveById(input.hospitalId))) {
      throw new NotFoundException(`Hospital ${input.hospitalId} not found`);
    }
    const testIds = [...new Set(input.testIds)];
    const found = await this.tests.findActiveByIds(testIds);
    if (found.length !== testIds.length) {
      throw new BadRequestException('One or more tests are invalid or inactive');
    }

    const order = await this.repo.create({
      patientId: input.patientId,
      hospitalId: input.hospitalId,
      orderedById: input.orderedById,
      notes: input.notes,
      createdBy: userId,
      updatedBy: userId,
      items: { create: testIds.map((testId) => ({ testId })) },
    });
    return toLabOrderView(order);
  }

  async findById(id: string) {
    const order = await this.repo.findWithItems(id);
    if (!order) throw new NotFoundException('Lab order not found');
    return toLabOrderView(order);
  }

  async list(query: LabOrderQueryDto) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      hospitalId: query.hospitalId,
      status: query.status,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toLabOrderView), total, query.page, query.limit);
  }

  collectSample(id: string, version: number, userId: string) {
    return this.transition(id, version, 'SAMPLE_COLLECTED', userId, {
      sampleCollectedAt: new Date(),
    });
  }

  startProcessing(id: string, version: number, userId: string) {
    return this.transition(id, version, 'IN_PROGRESS', userId, {});
  }

  async complete(id: string, version: number, userId: string) {
    const unresulted = await this.repo.countUnresulted(id);
    if (unresulted > 0) {
      throw new ConflictException(`Cannot complete: ${unresulted} test(s) still have no result`);
    }
    return this.transition(id, version, 'COMPLETED', userId, { completedAt: new Date() });
  }

  cancel(id: string, input: CancelLabOrderInput, userId: string) {
    return this.transition(id, input.version, 'CANCELLED', userId, {
      cancelledAt: new Date(),
      cancellationReason: input.reason,
    });
  }

  async enterResult(orderId: string, itemId: string, input: EnterResultInput, userId: string) {
    const order = await this.repo.findBareById(orderId);
    if (!order) throw new NotFoundException('Lab order not found');
    if (order.status !== 'IN_PROGRESS') {
      throw new ConflictException('Results can only be entered while the order is IN_PROGRESS');
    }
    const item = await this.repo.findItem(orderId, itemId);
    assertUpdatable(item, input.version, 'Lab result');

    const count = await this.repo.updateItemGuarded(orderId, itemId, input.version, {
      resultValue: input.resultValue,
      unit: input.unit,
      flag: input.flag,
      resultNotes: input.resultNotes,
      resultedAt: new Date(),
      resultedById: userId,
    });
    assertWritten(count, 'Lab result');
    return this.findById(orderId);
  }

  async report(id: string) {
    const view = await this.findById(id);
    if (view.status !== 'COMPLETED') {
      throw new ConflictException('Report is available only for COMPLETED orders');
    }
    return view;
  }

  private async transition(
    id: string,
    version: number,
    to: LabOrderStatus,
    userId: string,
    extra: Record<string, unknown>,
  ) {
    const current = await this.repo.findBareById(id);
    assertUpdatable(current, version, 'Lab order');
    assertLabTransition(current.status, to);

    const count = await this.repo.updateGuarded(id, version, {
      status: to,
      updatedBy: userId,
      ...extra,
    });
    assertWritten(count, 'Lab order');
    return this.findById(id);
  }
}
