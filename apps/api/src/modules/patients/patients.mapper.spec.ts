import type { Patient } from '@prisma/client';
import { toPatientView } from './patients.mapper';

function patient(patientNumber: number): Patient {
  return {
    id: 'p1',
    patientNumber,
    firstName: 'Alice',
    lastName: 'Walker',
    middleName: null,
    dateOfBirth: new Date('1990-05-14'),
    gender: 'FEMALE',
    bloodGroup: null,
    maritalStatus: null,
    email: null,
    phone: '123',
    nationalId: null,
    addressLine: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    status: 'ACTIVE',
    hospitalId: null,
    branchId: null,
    userId: null,
    version: 1,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe('toPatientView (MRN)', () => {
  it('derives a zero-padded MRN from the patient number', () => {
    expect(toPatientView(patient(1)).mrn).toBe('MRN-000001');
    expect(toPatientView(patient(42)).mrn).toBe('MRN-000042');
    expect(toPatientView(patient(1234567)).mrn).toBe('MRN-1234567');
  });

  it('preserves all original patient fields', () => {
    const view = toPatientView(patient(7));
    expect(view.firstName).toBe('Alice');
    expect(view.patientNumber).toBe(7);
  });
});
