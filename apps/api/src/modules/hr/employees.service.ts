import { Injectable, NotFoundException } from '@nestjs/common';
import type { EmployeeStatus } from '@prisma/client';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { HrRepository } from './hr.repository';
import { dateOnly, toEmployeeView } from './hr.mapper';

@Injectable()
export class EmployeesService {
  constructor(private readonly repo: HrRepository) {}

  async create(input: CreateEmployeeInput, userId: string) {
    const { joinedAt, ...rest } = input;
    const employee = await this.repo.createEmployee({ ...rest, joinedAt: dateOnly(joinedAt), createdBy: userId, updatedBy: userId });
    return toEmployeeView(employee);
  }

  async findById(id: string) {
    const e = await this.repo.findEmployee(id);
    if (!e) throw new NotFoundException('Employee not found');
    return toEmployeeView(e);
  }

  async list(query: { page: number; limit: number; sortOrder: 'asc' | 'desc'; search?: string; status?: EmployeeStatus }) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.listEmployees({ skip, take, search: query.search, status: query.status, sortOrder: query.sortOrder });
    return PaginatedResult.from(items.map(toEmployeeView), total, query.page, query.limit);
  }

  async update(id: string, input: UpdateEmployeeInput, userId: string) {
    const { version, ...changes } = input;
    const current = await this.repo.findEmployee(id);
    assertUpdatable(current, version, 'Employee');
    assertWritten(await this.repo.updateEmployee(id, version, { ...changes, updatedBy: userId }), 'Employee');
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    if (!(await this.repo.findEmployee(id))) throw new NotFoundException('Employee not found');
    await this.repo.softDeleteEmployee(id, userId);
    return { id };
  }
}
