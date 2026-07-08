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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, DepartmentQueryDto, UpdateDepartmentDto } from './dto/department.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Post()
  @Permissions(PERMISSIONS.DEPARTMENT_CREATE)
  @ResponseMessage('Department created successfully')
  @ApiOperation({ summary: 'Create a department under a hospital (optionally a branch)' })
  create(@Body() dto: CreateDepartmentDto, @CurrentUser('id') userId: string) {
    return this.departments.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.DEPARTMENT_READ)
  @ResponseMessage('Departments retrieved successfully')
  @ApiOperation({ summary: 'List departments (filter by hospitalId, branchId, type)' })
  list(@Query() query: DepartmentQueryDto) {
    return this.departments.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.DEPARTMENT_READ)
  @ResponseMessage('Department retrieved successfully')
  @ApiOperation({ summary: 'Get a department by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.departments.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.DEPARTMENT_UPDATE)
  @ResponseMessage('Department updated successfully')
  @ApiOperation({ summary: 'Update a department (optimistic lock via version)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.departments.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.DEPARTMENT_DELETE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Department deleted successfully')
  @ApiOperation({ summary: 'Soft-delete a department' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.departments.remove(id, userId);
  }
}
