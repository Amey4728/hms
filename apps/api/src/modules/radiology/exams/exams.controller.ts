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
import { PERMISSIONS, createRadiologyExamSchema, updateRadiologyExamSchema } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ExamsService } from './exams.service';

class CreateExamDto extends createZodDto(createRadiologyExamSchema) {}
class UpdateExamDto extends createZodDto(updateRadiologyExamSchema) {}

@ApiTags('Radiology · Exams')
@ApiBearerAuth()
@Controller('radiology/exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Post()
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Exam created successfully')
  @ApiOperation({ summary: 'Add an imaging exam to the catalogue' })
  create(@Body() dto: CreateExamDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Exams retrieved successfully')
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Exam retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @ResponseMessage('Exam updated successfully')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateExamDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.RADIOLOGY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Exam deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }
}
