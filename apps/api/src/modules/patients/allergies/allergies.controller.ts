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
import { CreateAllergyDto, UpdateAllergyDto } from './allergies.dto';
import { AllergiesService } from './allergies.service';

@ApiTags('Patient · Allergies')
@ApiBearerAuth()
@Controller('patients/:patientId/allergies')
export class AllergiesController {
  constructor(private readonly service: AllergiesService) {}

  @Post()
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Allergy recorded successfully')
  @ApiOperation({ summary: 'Record an allergy for a patient' })
  create(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreateAllergyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(patientId, dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Allergies retrieved successfully')
  @ApiOperation({ summary: "List a patient's allergies" })
  list(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.service.list(patientId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Allergy updated successfully')
  @ApiOperation({ summary: 'Update an allergy (optimistic lock)' })
  update(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAllergyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(patientId, id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Allergy removed successfully')
  @ApiOperation({ summary: 'Remove an allergy' })
  remove(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(patientId, id, userId);
  }
}
