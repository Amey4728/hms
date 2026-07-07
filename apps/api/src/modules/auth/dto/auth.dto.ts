import { createZodDto } from 'nestjs-zod';
import { loginSchema, registerSchema } from '@hms/shared';

/** DTOs reuse the Zod schemas defined once in @hms/shared (DRY across FE/BE). */
export class LoginDto extends createZodDto(loginSchema) {}
export class RegisterDto extends createZodDto(registerSchema) {}
