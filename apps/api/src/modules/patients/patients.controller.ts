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
import { PERMISSIONS } from '@hms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CreatePatientDto, PatientQueryDto, UpdatePatientDto } from './dto/patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  @Permissions(PERMISSIONS.PATIENT_CREATE)
  @ResponseMessage('Patient registered successfully')
  @ApiOperation({ summary: 'Register a patient (MRN auto-generated)' })
  create(@Body() dto: CreatePatientDto, @CurrentUser('id') userId: string) {
    return this.patients.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Patients retrieved successfully')
  @ApiOperation({ summary: 'List patients (search by name/phone/MRN number, filter, sort)' })
  list(@Query() query: PatientQueryDto) {
    return this.patients.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Patient profile retrieved successfully')
  @ApiOperation({ summary: 'Get a patient full profile (with contacts, allergies, history)' })
  getProfile(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.patients.getProfile(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Patient updated successfully')
  @ApiOperation({ summary: 'Update a patient (optimistic lock via version)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.patients.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PATIENT_DELETE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Patient deleted successfully')
  @ApiOperation({ summary: 'Soft-delete a patient' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.patients.remove(id, userId);
  }
}
