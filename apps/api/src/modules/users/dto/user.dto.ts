import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}

export const usersQuerySchema = paginationQuerySchema.extend({
  role: z.string().trim().min(1).optional(),
});
export class UsersQueryDto extends createZodDto(usersQuerySchema) {}
