import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createDepartmentSchema, departmentTypeSchema, updateDepartmentSchema } from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreateDepartmentDto extends createZodDto(createDepartmentSchema) {}
export class UpdateDepartmentDto extends createZodDto(updateDepartmentSchema) {}

export const departmentQuerySchema = paginationQuerySchema.extend({
  hospitalId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  type: departmentTypeSchema.optional(),
});
export class DepartmentQueryDto extends createZodDto(departmentQuerySchema) {}
