import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type InvoiceStatus, type PaymentMethod, type PaymentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const invoiceInclude = Prisma.validator<Prisma.InvoiceInclude>()({
  items: { orderBy: { createdAt: 'asc' } },
  payments: { orderBy: { createdAt: 'asc' } },
  patient: { select: { firstName: true, lastName: true, patientNumber: true } },
});
export type InvoiceWithDetails = Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>;

function deriveStatus(
  total: Prisma.Decimal,
  paid: Prisma.Decimal,
  type: PaymentType,
): InvoiceStatus {
  if (paid.gte(total)) return 'PAID';
  if (paid.lte(0)) return type === 'REFUND' ? 'REFUNDED' : 'ISSUED';
  return type === 'REFUND' ? 'REFUNDED' : 'PARTIALLY_PAID';
}

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InvoiceUncheckedCreateInput): Promise<InvoiceWithDetails> {
    return this.prisma.invoice.create({ data, include: invoiceInclude });
  }

  findWithDetails(id: string): Promise<InvoiceWithDetails | null> {
    return this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: invoiceInclude,
    });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    status?: InvoiceStatus;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: InvoiceWithDetails[]; total: number }> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total };
  }

  /** Records a payment or refund and recomputes amountPaid + status atomically. */
  async addPayment(params: {
    invoiceId: string;
    amount: number;
    method: PaymentMethod;
    type: PaymentType;
    reference?: string;
    note?: string;
    receivedById: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: params.invoiceId, deletedAt: null },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'CANCELLED') {
        throw new ConflictException('Cannot transact on a cancelled invoice');
      }

      const amount = new Prisma.Decimal(params.amount);
      let newPaid: Prisma.Decimal;
      if (params.type === 'PAYMENT') {
        newPaid = invoice.amountPaid.add(amount);
        if (newPaid.gt(invoice.total)) {
          throw new BadRequestException(
            `Payment exceeds balance (balance ${invoice.total.sub(invoice.amountPaid).toFixed(2)})`,
          );
        }
      } else {
        if (amount.gt(invoice.amountPaid)) {
          throw new BadRequestException(
            `Refund exceeds amount paid (${invoice.amountPaid.toFixed(2)})`,
          );
        }
        newPaid = invoice.amountPaid.sub(amount);
      }

      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          method: params.method,
          type: params.type,
          reference: params.reference,
          note: params.note,
          receivedById: params.receivedById,
        },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newPaid,
          status: deriveStatus(invoice.total, newPaid, params.type),
          version: { increment: 1 },
          updatedBy: params.receivedById,
        },
      });
    });
  }

  async cancel(
    id: string,
    expectedVersion: number,
    reason: string | undefined,
    userId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id, deletedAt: null } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.version !== expectedVersion) {
        throw new ConflictException('Invoice was modified by someone else. Reload and try again.');
      }
      if (!invoice.amountPaid.isZero()) {
        throw new ConflictException('Cannot cancel an invoice that has payments; refund first');
      }
      await tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
          version: { increment: 1 },
          updatedBy: userId,
        },
      });
    });
  }
}
