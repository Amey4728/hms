import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PERMISSIONS,
  closeVisitSchema,
  createDiagnosisSchema,
  createVisitSchema,
  updateVisitSchema,
} from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';
import { VisitsService } from './visits.service';

class CreateVisitDto extends createZodDto(createVisitSchema) {}
class UpdateVisitDto extends createZodDto(updateVisitSchema) {}
class CloseVisitDto extends createZodDto(closeVisitSchema) {}
class CreateDiagnosisDto extends createZodDto(createDiagnosisSchema) {}
class VisitQueryDto extends createZodDto(
  paginationQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    status: z.enum(['OPEN', 'CLOSED']).optional(),
  }),
) {}

@ApiTags('Clinical · Visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitsController {
  constructor(private readonly service: VisitsService) {}

  @Post()
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Visit created successfully')
  @ApiOperation({ summary: 'Open a clinical visit (with vitals + notes)' })
  create(@Body() dto: CreateVisitDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Visits retrieved successfully')
  list(@Query() query: VisitQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Visit retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Visit updated successfully')
  @ApiOperation({ summary: 'Update doctor notes / vitals (optimistic lock)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVisitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Patch(':id/close')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Visit closed')
  close(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CloseVisitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.close(id, dto.version, userId);
  }

  @Post(':id/diagnoses')
  @Permissions(PERMISSIONS.DIAGNOSIS_CREATE)
  @ResponseMessage('Diagnosis recorded successfully')
  @ApiOperation({ summary: 'Add a diagnosis to a visit' })
  addDiagnosis(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateDiagnosisDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.addDiagnosis(id, dto, userId);
  }

  @Delete(':id/diagnoses/:diagnosisId')
  @Permissions(PERMISSIONS.DIAGNOSIS_CREATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Diagnosis removed')
  removeDiagnosis(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('diagnosisId', new ParseUUIDPipe()) diagnosisId: string,
  ) {
    return this.service.removeDiagnosis(id, diagnosisId);
  }
}
