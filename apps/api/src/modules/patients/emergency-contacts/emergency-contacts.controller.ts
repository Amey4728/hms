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
import {
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
} from './emergency-contacts.dto';
import { EmergencyContactsService } from './emergency-contacts.service';

@ApiTags('Patient · Emergency Contacts')
@ApiBearerAuth()
@Controller('patients/:patientId/emergency-contacts')
export class EmergencyContactsController {
  constructor(private readonly service: EmergencyContactsService) {}

  @Post()
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Emergency contact added successfully')
  @ApiOperation({ summary: 'Add an emergency contact to a patient' })
  create(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreateEmergencyContactDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(patientId, dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PATIENT_READ)
  @ResponseMessage('Emergency contacts retrieved successfully')
  @ApiOperation({ summary: "List a patient's emergency contacts" })
  list(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.service.list(patientId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @ResponseMessage('Emergency contact updated successfully')
  @ApiOperation({ summary: 'Update an emergency contact (optimistic lock)' })
  update(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEmergencyContactDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(patientId, id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Emergency contact removed successfully')
  @ApiOperation({ summary: 'Remove an emergency contact' })
  remove(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(patientId, id, userId);
  }
}
