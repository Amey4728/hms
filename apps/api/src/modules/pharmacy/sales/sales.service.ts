import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateSaleInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { HospitalsRepository } from '../../hospitals/hospitals.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { toSaleView } from '../pharmacy.mapper';
import type { SaleQueryDto } from './sales.dto';
import { SalesRepository } from './sales.repository';

@Injectable()
export class SalesService {
  constructor(
    private readonly repo: SalesRepository,
    private readonly patients: PatientsRepository,
    private readonly hospitals: HospitalsRepository,
  ) {}

  async create(input: CreateSaleInput, userId: string) {
    if (input.patientId && !(await this.patients.existsActive(input.patientId))) {
      throw new NotFoundException(`Patient ${input.patientId} not found`);
    }
    if (input.hospitalId && !(await this.hospitals.findActiveById(input.hospitalId))) {
      throw new NotFoundException(`Hospital ${input.hospitalId} not found`);
    }
    const saleId = await this.repo.createSaleTransactional({
      patientId: input.patientId,
      hospitalId: input.hospitalId,
      soldById: userId,
      discount: input.discount,
      taxRate: input.taxRate,
      items: input.items,
    });
    return this.findById(saleId);
  }

  async findById(id: string) {
    const sale = await this.repo.findWithItems(id);
    if (!sale) throw new NotFoundException('Sale not found');
    return toSaleView(sale);
  }

  async list(query: SaleQueryDto) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toSaleView), total, query.page, query.limit);
  }
}
