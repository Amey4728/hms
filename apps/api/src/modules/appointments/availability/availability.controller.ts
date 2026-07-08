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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityQueryDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './availability.dto';

@ApiTags('Doctor Availability')
@ApiBearerAuth()
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Post()
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE)
  @ResponseMessage('Availability created successfully')
  @ApiOperation({ summary: 'Add a recurring availability block for a doctor' })
  create(@Body() dto: CreateAvailabilityDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  @ResponseMessage('Availability retrieved successfully')
  @ApiOperation({ summary: "List a doctor's availability blocks" })
  list(@Query() query: AvailabilityQueryDto) {
    return this.service.listByDoctor(query.doctorId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE)
  @ResponseMessage('Availability updated successfully')
  @ApiOperation({ summary: 'Update an availability block (optimistic lock)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.DOCTOR_SCHEDULE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Availability removed successfully')
  @ApiOperation({ summary: 'Remove an availability block' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }
}
