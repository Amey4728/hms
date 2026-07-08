import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateRadiologyExamInput, UpdateRadiologyExamInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { toExamView } from '../radiology.mapper';
import { ExamsRepository } from './exams.repository';

@Injectable()
export class ExamsService {
  constructor(private readonly repo: ExamsRepository) {}

  async create(input: CreateRadiologyExamInput, userId: string) {
    return toExamView(await this.repo.create({ ...input, createdBy: userId, updatedBy: userId }));
  }

  async findById(id: string) {
    const exam = await this.repo.findActiveById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    return toExamView(exam);
  }

  async list(query: PaginationQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toExamView), total, query.page, query.limit);
  }

  async update(id: string, input: UpdateRadiologyExamInput, userId: string) {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Exam');
    assertWritten(
      await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId }),
      'Exam',
    );
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    if (!(await this.repo.findActiveById(id))) throw new NotFoundException('Exam not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }
}
