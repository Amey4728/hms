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
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PERMISSIONS,
  cancelStudySchema,
  createStudySchema,
  radiologyStatusSchema,
  reportStudySchema,
  scheduleStudySchema,
  studyTransitionSchema,
} from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';
import { StudiesService } from './studies.service';

class CreateStudyDto extends createZodDto(createStudySchema) {}
class ScheduleDto extends createZodDto(scheduleStudySchema) {}
class TransitionDto extends createZodDto(studyTransitionSchema) {}
class ReportDto extends createZodDto(reportStudySchema) {}
class CancelDto extends createZodDto(cancelStudySchema) {}
class StudyQueryDto extends createZodDto(
  paginationQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    status: radiologyStatusSchema.optional(),
  }),
) {}

@ApiTags('Radiology · Studies')
@ApiBearerAuth()
@Controller('radiology/studies')
export class StudiesController {
  constructor(private readonly service: StudiesService) {}

  @Post()
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Study requested successfully')
  @ApiOperation({ summary: 'Request an imaging study' })
  create(@Body() dto: CreateStudyDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Studies retrieved successfully')
  list(@Query() query: StudyQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Study retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/schedule')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Study scheduled')
  schedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ScheduleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.schedule(id, dto, userId);
  }

  @Patch(':id/perform')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Study marked performed')
  perform(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.perform(id, dto.version, userId);
  }

  @Patch(':id/report')
  @Permissions(PERMISSIONS.RADIOLOGY_REPORT_UPLOAD)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Report uploaded')
  @ApiOperation({ summary: 'Upload the report (findings/impression/image) → REPORTED' })
  report(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReportDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.report(id, dto, userId);
  }

  @Patch(':id/cancel')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Study cancelled')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.cancel(id, dto, userId);
  }
}
