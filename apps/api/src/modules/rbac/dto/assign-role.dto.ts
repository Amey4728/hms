import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export class AssignRoleDto extends createZodDto(assignRoleSchema) {}
