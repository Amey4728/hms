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
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateHospitalDto, UpdateHospitalDto } from './dto/hospital.dto';
import { HospitalsService } from './hospitals.service';

@ApiTags('Hospitals')
@ApiBearerAuth()
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitals: HospitalsService) {}

  @Post()
  @Permissions(PERMISSIONS.HOSPITAL_CREATE)
  @ResponseMessage('Hospital created successfully')
  @ApiOperation({ summary: 'Create a hospital' })
  create(@Body() dto: CreateHospitalDto, @CurrentUser('id') userId: string) {
    return this.hospitals.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.HOSPITAL_READ)
  @ResponseMessage('Hospitals retrieved successfully')
  @ApiOperation({ summary: 'List hospitals (paginated, filterable, sortable)' })
  list(@Query() query: PaginationQueryDto) {
    return this.hospitals.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.HOSPITAL_READ)
  @ResponseMessage('Hospital retrieved successfully')
  @ApiOperation({ summary: 'Get a hospital by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.hospitals.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.HOSPITAL_UPDATE)
  @ResponseMessage('Hospital updated successfully')
  @ApiOperation({ summary: 'Update a hospital (optimistic lock via version)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateHospitalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hospitals.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.HOSPITAL_DELETE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Hospital deleted successfully')
  @ApiOperation({ summary: 'Soft-delete a hospital (blocked if it has children)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.hospitals.remove(id, userId);
  }
}
