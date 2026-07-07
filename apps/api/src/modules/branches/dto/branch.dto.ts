import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createBranchSchema, updateBranchSchema } from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreateBranchDto extends createZodDto(createBranchSchema) {}
export class UpdateBranchDto extends createZodDto(updateBranchSchema) {}

export const branchQuerySchema = paginationQuerySchema.extend({
  hospitalId: z.string().uuid().optional(),
});
export class BranchQueryDto extends createZodDto(branchQuerySchema) {}
