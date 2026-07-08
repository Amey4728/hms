import {
  Body,
  Controller,
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
import { AppointmentsService } from './appointments.service';
import {
  AppointmentQueryDto,
  BookAppointmentDto,
  CancelAppointmentDto,
  QueueQueryDto,
  RescheduleDto,
  SlotsQueryDto,
  TransitionDto,
  WalkInDto,
} from './dto/appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  @Permissions(PERMISSIONS.APPOINTMENT_CREATE)
  @ResponseMessage('Appointment booked successfully')
  @ApiOperation({ summary: 'Book a scheduled appointment' })
  book(@Body() dto: BookAppointmentDto, @CurrentUser('id') userId: string) {
    return this.appointments.book(dto, userId);
  }

  @Post('walk-in')
  @Permissions(PERMISSIONS.APPOINTMENT_CREATE)
  @ResponseMessage('Walk-in registered and checked in')
  @ApiOperation({ summary: 'Register a walk-in (auto check-in + token)' })
  walkIn(@Body() dto: WalkInDto, @CurrentUser('id') userId: string) {
    return this.appointments.walkIn(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  @ResponseMessage('Appointments retrieved successfully')
  @ApiOperation({ summary: 'List appointments (filter by doctor/patient/status/date range)' })
  list(@Query() query: AppointmentQueryDto) {
    return this.appointments.list(query);
  }

  @Get('slots')
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  @ResponseMessage('Available slots retrieved successfully')
  @ApiOperation({ summary: "Free slots for a doctor on a date (from availability)" })
  slots(@Query() query: SlotsQueryDto) {
    return this.appointments.slotsFor(query.doctorId, query.date);
  }

  @Get('queue')
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  @ResponseMessage('Queue retrieved successfully')
  @ApiOperation({ summary: "Live queue (checked-in / in-progress) for a doctor on a date" })
  queue(@Query() query: QueueQueryDto) {
    return this.appointments.queue(query.doctorId, query.date);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.APPOINTMENT_READ)
  @ResponseMessage('Appointment retrieved successfully')
  @ApiOperation({ summary: 'Get an appointment by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointments.findById(id);
  }

  @Patch(':id/reschedule')
  @Permissions(PERMISSIONS.APPOINTMENT_UPDATE)
  @ResponseMessage('Appointment rescheduled successfully')
  @ApiOperation({ summary: 'Reschedule a BOOKED appointment' })
  reschedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RescheduleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointments.reschedule(id, dto, userId);
  }

  @Patch(':id/check-in')
  @Permissions(PERMISSIONS.APPOINTMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Appointment checked in')
  @ApiOperation({ summary: 'Check in a booked appointment (assigns queue token)' })
  checkIn(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointments.checkIn(id, dto, userId);
  }

  @Patch(':id/start')
  @Permissions(PERMISSIONS.APPOINTMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Consultation started')
  @ApiOperation({ summary: 'Start the consultation (CHECKED_IN → IN_PROGRESS)' })
  start(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointments.start(id, dto, userId);
  }

  @Patch(':id/complete')
  @Permissions(PERMISSIONS.APPOINTMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Consultation completed')
  @ApiOperation({ summary: 'Complete the consultation (IN_PROGRESS → COMPLETED)' })
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointments.complete(id, dto, userId);
  }

  @Patch(':id/no-show')
  @Permissions(PERMISSIONS.APPOINTMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Appointment marked as no-show')
  @ApiOperation({ summary: 'Mark a booked appointment as NO_SHOW' })
  noShow(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointments.noShow(id, dto, userId);
  }

  @Patch(':id/cancel')
  @Permissions(PERMISSIONS.APPOINTMENT_CANCEL)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Appointment cancelled')
  @ApiOperation({ summary: 'Cancel an appointment' })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.appointments.cancel(id, dto, userId);
  }
}
