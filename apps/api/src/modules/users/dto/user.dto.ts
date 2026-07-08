import { createZodDto } from 'nestjs-zod';
import { createUserSchema, updateUserSchema, updateUserStatusSchema } from '@hms/shared';

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
