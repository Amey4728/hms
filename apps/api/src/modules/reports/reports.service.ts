import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface Range {
  from?: string;
  to?: string;
}

function toWindow(range: Range): { gte?: Date; lte?: Date } | undefined {
  const w: { gte?: Date; lte?: Date } = {};
  if (range.from) w.gte = new Date(`${range.from}T00:00:00.000Z`);
  if (range.to) w.lte = new Date(`${range.to}T23:59:59.999Z`);
  return w.gte || w.lte ? w : undefined;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [patients, appointments, invoiceAgg, salesAgg, labOrders, medicines] = await Promise.all([
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.appointment.count({ where: { deletedAt: null } }),
      this.prisma.invoice.aggregate({
        where: { deletedAt: null, status: { not: 'CANCELLED' } },
        _sum: { total: true, amountPaid: true },
      }),
      this.prisma.pharmacySale.aggregate({ where: { deletedAt: null }, _sum: { total: true } }),
      this.prisma.labOrder.count({ where: { deletedAt: null } }),
      this.prisma.medicine.count({ where: { deletedAt: null } }),
    ]);
    const billed = invoiceAgg._sum.total?.toNumber() ?? 0;
    const collected = invoiceAgg._sum.amountPaid?.toNumber() ?? 0;
    return {
      patients,
      appointments,
      labOrders,
      medicines,
      revenue: {
        billed,
        collected,
        outstanding: Number((billed - collected).toFixed(2)),
        pharmacySales: salesAgg._sum.total?.toNumber() ?? 0,
      },
    };
  }

  async revenue(range: Range) {
    const window = toWindow(range);
    const [inv, sales] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { deletedAt: null, status: { not: 'CANCELLED' }, ...(window ? { createdAt: window } : {}) },
        _sum: { total: true, amountPaid: true, discount: true, tax: true },
        _count: true,
      }),
      this.prisma.pharmacySale.aggregate({
        where: { deletedAt: null, ...(window ? { createdAt: window } : {}) },
        _sum: { total: true },
        _count: true,
      }),
    ]);
    const billed = inv._sum.total?.toNumber() ?? 0;
    const collected = inv._sum.amountPaid?.toNumber() ?? 0;
    return {
      invoices: {
        count: inv._count,
        billed,
        collected,
        outstanding: Number((billed - collected).toFixed(2)),
        discount: inv._sum.discount?.toNumber() ?? 0,
        tax: inv._sum.tax?.toNumber() ?? 0,
      },
      pharmacy: { count: sales._count, revenue: sales._sum.total?.toNumber() ?? 0 },
    };
  }

  async appointments(range: Range) {
    const window = toWindow(range);
    const where = { deletedAt: null, ...(window ? { scheduledStart: window } : {}) };
    const [byStatus, byType, total] = await Promise.all([
      this.prisma.appointment.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.appointment.groupBy({ by: ['type'], where, _count: true }),
      this.prisma.appointment.count({ where }),
    ]);
    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      byType: Object.fromEntries(byType.map((r) => [r.type, r._count])),
    };
  }

  async patients() {
    const [total, byGender, byStatus] = await Promise.all([
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.patient.groupBy({ by: ['gender'], where: { deletedAt: null }, _count: true }),
      this.prisma.patient.groupBy({ by: ['status'], where: { deletedAt: null }, _count: true }),
    ]);
    return {
      total,
      byGender: Object.fromEntries(byGender.map((r) => [r.gender, r._count])),
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
    };
  }

  async doctors() {
    const grouped = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { deletedAt: null },
      _count: true,
    });
    const doctors = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.doctorId) } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameOf = new Map(doctors.map((d) => [d.id, `${d.firstName} ${d.lastName}`]));
    return grouped
      .map((g) => ({ doctorId: g.doctorId, doctorName: nameOf.get(g.doctorId) ?? 'Unknown', appointments: g._count }))
      .sort((a, b) => b.appointments - a.appointments);
  }

  async inventory() {
    const meds = await this.prisma.medicine.findMany({
      where: { deletedAt: null, isActive: true },
      include: { batches: { where: { deletedAt: null }, select: { quantity: true, expiryDate: true } } },
    });
    const soon = new Date();
    soon.setUTCDate(soon.getUTCDate() + 30);
    let lowStock = 0;
    let expiringBatches = 0;
    let stockValue = 0;
    for (const m of meds) {
      const stock = m.batches.reduce((s, b) => s + b.quantity, 0);
      if (stock <= m.reorderLevel) lowStock++;
      stockValue += stock * m.unitPrice.toNumber();
      expiringBatches += m.batches.filter((b) => b.quantity > 0 && b.expiryDate <= soon).length;
    }
    return {
      medicines: meds.length,
      lowStock,
      expiringBatches,
      stockValue: Number(stockValue.toFixed(2)),
    };
  }

  async occupancy() {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const grouped = await this.prisma.appointment.groupBy({
      by: ['hospitalId', 'status'],
      where: { deletedAt: null, scheduledStart: { gte: start, lt: end } },
      _count: true,
    });
    const hospitals = await this.prisma.hospital.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });
    return hospitals.map((h) => {
      const rows = grouped.filter((g) => g.hospitalId === h.id);
      const count = (s: string) => rows.filter((r) => r.status === s).reduce((a, r) => a + r._count, 0);
      return {
        hospitalId: h.id,
        hospitalName: h.name,
        today: rows.reduce((a, r) => a + r._count, 0),
        inProgress: count('IN_PROGRESS'),
        checkedIn: count('CHECKED_IN'),
      };
    });
  }
}
