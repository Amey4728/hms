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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { CreateMedicalHistoryDto, UpdateMedicalHistoryDto } from './medical-history.dto';
import { MedicalHistoryService } from './medical-history.service';

@ApiTags('Patient · Medical History')
@ApiBearerAuth()
@Controller('patients/:patientId/medical-history')
export class MedicalHistoryController {
  constructor(private readonly service: MedicalHistoryService) {}

  @Post()
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Medical history entry added successfully')
  @ApiOperation({ summary: 'Add a medical history entry' })
  create(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreateMedicalHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(patientId, dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Medical history retrieved successfully')
  @ApiOperation({ summary: "List a patient's medical history" })
  list(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.service.list(patientId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Medical history entry updated successfully')
  @ApiOperation({ summary: 'Update a medical history entry (optimistic lock)' })
  update(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMedicalHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(patientId, id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Medical history entry removed successfully')
  @ApiOperation({ summary: 'Remove a medical history entry' })
  remove(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(patientId, id, userId);
  }
}
