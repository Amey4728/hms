import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PERMISSIONS, createPrescriptionSchema } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';
import { PrescriptionsService } from './prescriptions.service';

class CreatePrescriptionDto extends createZodDto(createPrescriptionSchema) {}
class PrescriptionQueryDto extends createZodDto(paginationQuerySchema.extend({ patientId: z.string().uuid().optional() })) {}

@ApiTags('Clinical · Prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Post()
  @Permissions(PERMISSIONS.PRESCRIPTION_CREATE)
  @ResponseMessage('Prescription created successfully')
  @ApiOperation({ summary: 'Create a prescription with drug items' })
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PRESCRIPTION_READ)
  @ResponseMessage('Prescriptions retrieved successfully')
  list(@Query() query: PrescriptionQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PRESCRIPTION_READ)
  @ResponseMessage('Prescription retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }
}
