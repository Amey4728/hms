import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from './availability/availability.repository';
import { AppointmentsRepository } from './appointments.repository';

export interface Slot {
  start: string;
  end: string;
}

/**
 * Generates bookable slots for a doctor on a date: availability blocks stepped by
 * slot duration, minus times already occupied by active appointments and the past.
 * Times are treated as UTC for determinism.
 */
@Injectable()
export class SlotsService {
  constructor(
    private readonly availability: AvailabilityRepository,
    private readonly appointments: AppointmentsRepository,
  ) {}

  async generate(doctorId: string, dateStr: string): Promise<Slot[]> {
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = dayStart.getUTCDay();

    const blocks = await this.availability.findActiveByDoctorAndDay(doctorId, dayOfWeek);
    if (blocks.length === 0) return [];

    const existing = await this.appointments.findForDoctorInWindow(doctorId, dayStart, dayEnd);
    const now = new Date();
    const slots: Slot[] = [];

    for (const block of blocks) {
      const blockStart = this.at(dateStr, block.startTime);
      const blockEnd = this.at(dateStr, block.endTime);
      const stepMs = block.slotDurationMinutes * 60 * 1000;

      for (let t = blockStart.getTime(); t + stepMs <= blockEnd.getTime(); t += stepMs) {
        const slotStart = new Date(t);
        const slotEnd = new Date(t + stepMs);
        const overlaps = existing.some(
          (a) => a.scheduledStart < slotEnd && a.scheduledEnd > slotStart,
        );
        if (!overlaps && slotEnd > now) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        }
      }
    }

    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }

  private at(dateStr: string, time: string): Date {
    const [h, m] = time.split(':');
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCHours(Number(h), Number(m), 0, 0);
    return d;
  }
}
