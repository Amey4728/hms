import { createZodDto } from 'nestjs-zod';
import { createMedicineSchema, updateMedicineSchema } from '@hms/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateMedicineDto extends createZodDto(createMedicineSchema) {}
export class UpdateMedicineDto extends createZodDto(updateMedicineSchema) {}
export class MedicineQueryDto extends PaginationQueryDto {}
