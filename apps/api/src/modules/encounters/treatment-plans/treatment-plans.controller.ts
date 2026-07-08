import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERMISSIONS, createTreatmentPlanSchema, updateTreatmentPlanSchema } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';
import { TreatmentPlansService } from './treatment-plans.service';

class CreateTreatmentPlanDto extends createZodDto(createTreatmentPlanSchema) {}
class UpdateTreatmentPlanDto extends createZodDto(updateTreatmentPlanSchema) {}
class TreatmentPlanQueryDto extends createZodDto(
  paginationQuerySchema.extend({ patientId: z.string().uuid().optional() }),
) {}

@ApiTags('Clinical · Treatment Plans')
@ApiBearerAuth()
@Controller('treatment-plans')
export class TreatmentPlansController {
  constructor(private readonly service: TreatmentPlansService) {}

  @Post()
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Treatment plan created successfully')
  create(@Body() dto: CreateTreatmentPlanDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Treatment plans retrieved successfully')
  list(@Query() query: TreatmentPlanQueryDto) {
    return this.service.list(query);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Treatment plan updated successfully')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTreatmentPlanDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.updateStatus(id, dto, userId);
  }
}
