import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ROLES } from '@hms/shared';
import { BranchesRepository } from '../branches/branches.repository';
import { DepartmentsRepository } from '../departments/departments.repository';
import { HospitalsRepository } from '../hospitals/hospitals.repository';
import { PatientsRepository } from '../patients/patients.repository';
import { UsersRepository } from '../users/users.repository';

/** Cross-entity validation shared by the availability and appointment services. */
@Injectable()
export class SchedulingValidationService {
  constructor(
    private readonly users: UsersRepository,
    private readonly patients: PatientsRepository,
    private readonly hospitals: HospitalsRepository,
    private readonly branches: BranchesRepository,
    private readonly departments: DepartmentsRepository,
  ) {}

  async assertActiveDoctor(doctorId: string): Promise<void> {
    const user = await this.users.findByIdWithRbac(doctorId);
    if (!user) throw new NotFoundException(`Doctor ${doctorId} not found`);
    if (user.status !== 'ACTIVE') throw new BadRequestException('Doctor is not active');
    const isDoctor = user.userRoles.some((ur) => ur.role.name === ROLES.DOCTOR);
    if (!isDoctor) throw new BadRequestException('Assigned user does not hold the DOCTOR role');
  }

  async assertPatient(patientId: string): Promise<void> {
    if (!(await this.patients.existsActive(patientId))) {
      throw new NotFoundException(`Patient ${patientId} not found`);
    }
  }

  async assertScope(hospitalId: string, branchId?: string, departmentId?: string): Promise<void> {
    const hospital = await this.hospitals.findActiveById(hospitalId);
    if (!hospital) throw new NotFoundException(`Hospital ${hospitalId} not found`);

    if (branchId) {
      const branch = await this.branches.findActiveById(branchId);
      if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);
      if (branch.hospitalId !== hospitalId) {
        throw new BadRequestException('Branch does not belong to the specified hospital');
      }
    }

    if (departmentId) {
      const department = await this.departments.findActiveById(departmentId);
      if (!department) throw new NotFoundException(`Department ${departmentId} not found`);
      if (department.hospitalId !== hospitalId) {
        throw new BadRequestException('Department does not belong to the specified hospital');
      }
      if (branchId && department.branchId && department.branchId !== branchId) {
        throw new BadRequestException('Department does not belong to the specified branch');
      }
    }
  }
}
