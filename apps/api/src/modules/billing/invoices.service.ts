import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CancelInvoiceInput,
  CreateInvoiceInput,
  RecordPaymentInput,
  RefundInput,
} from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { PatientsRepository } from '../patients/patients.repository';
import { toInvoiceView } from './billing.mapper';
import type { InvoiceQueryDto } from './invoices.dto';
import { InvoicesRepository } from './invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly repo: InvoicesRepository,
    private readonly patients: PatientsRepository,
  ) {}

  async create(input: CreateInvoiceInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId))) {
      throw new NotFoundException(`Patient ${input.patientId} not found`);
    }

    let subtotal = new Prisma.Decimal(0);
    const items = input.items.map((i) => {
      const lineTotal = new Prisma.Decimal(i.unitPrice).mul(i.quantity);
      subtotal = subtotal.add(lineTotal);
      return {
        description: i.description,
        quantity: i.quantity,
        unitPrice: new Prisma.Decimal(i.unitPrice),
        lineTotal,
      };
    });

    const discount = Prisma.Decimal.min(new Prisma.Decimal(input.discount), subtotal);
    const taxable = subtotal.sub(discount);
    const tax = taxable.mul(input.taxRate).div(100);
    const total = taxable.add(tax);

    const invoice = await this.repo.create({
      patientId: input.patientId,
      hospitalId: input.hospitalId,
      notes: input.notes,
      subtotal,
      discount,
      tax,
      total,
      status: 'ISSUED',
      createdBy: userId,
      updatedBy: userId,
      items: { create: items },
    });
    return toInvoiceView(invoice);
  }

  async findById(id: string) {
    const invoice = await this.repo.findWithDetails(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    return toInvoiceView(invoice);
  }

  async list(query: InvoiceQueryDto) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      status: query.status,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toInvoiceView), total, query.page, query.limit);
  }

  async recordPayment(id: string, input: RecordPaymentInput, userId: string) {
    await this.repo.addPayment({
      invoiceId: id,
      amount: input.amount,
      method: input.method,
      type: 'PAYMENT',
      reference: input.reference,
      note: input.note,
      receivedById: userId,
    });
    return this.findById(id);
  }

  async refund(id: string, input: RefundInput, userId: string) {
    await this.repo.addPayment({
      invoiceId: id,
      amount: input.amount,
      method: input.method,
      type: 'REFUND',
      note: input.reason,
      receivedById: userId,
    });
    return this.findById(id);
  }

  async cancel(id: string, input: CancelInvoiceInput, userId: string) {
    await this.repo.cancel(id, input.version, input.reason, userId);
    return this.findById(id);
  }
}
