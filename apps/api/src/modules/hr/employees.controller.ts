import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PERMISSIONS,
  createEmployeeSchema,
  createLeaveSchema,
  generatePayslipSchema,
  markAttendanceSchema,
  updateEmployeeSchema,
} from '@hms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../common/dto/pagination.dto';
import { EmployeesService } from './employees.service';
import { HrService } from './hr.service';

class CreateEmployeeDto extends createZodDto(createEmployeeSchema) {}
class UpdateEmployeeDto extends createZodDto(updateEmployeeSchema) {}
class MarkAttendanceDto extends createZodDto(markAttendanceSchema) {}
class RequestLeaveDto extends createZodDto(createLeaveSchema) {}
class GeneratePayslipDto extends createZodDto(generatePayslipSchema) {}
class EmployeeQueryDto extends createZodDto(
  paginationQuerySchema.extend({ status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED']).optional() }),
) {}
class RangeDto extends createZodDto(z.object({ from: z.string().optional(), to: z.string().optional() })) {}

@ApiTags('HR · Employees')
@ApiBearerAuth()
@Controller('hr/employees')
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly hr: HrService,
  ) {}

  @Post()
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @ResponseMessage('Employee created successfully')
  create(@Body() dto: CreateEmployeeDto, @CurrentUser('id') userId: string) {
    return this.employees.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @ResponseMessage('Employees retrieved successfully')
  list(@Query() query: EmployeeQueryDto) {
    return this.employees.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @ResponseMessage('Employee retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.employees.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @ResponseMessage('Employee updated successfully')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser('id') userId: string) {
    return this.employees.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Employee deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.employees.remove(id, userId);
  }

  // ── Attendance ─────────────────────────────────────────────────────────
  @Post(':id/attendance')
  @Permissions(PERMISSIONS.ATTENDANCE_MANAGE)
  @ResponseMessage('Attendance recorded')
  @ApiOperation({ summary: 'Mark attendance for a day (upsert)' })
  markAttendance(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: MarkAttendanceDto, @CurrentUser('id') userId: string) {
    return this.hr.markAttendance(id, dto, userId);
  }

  @Get(':id/attendance')
  @Permissions(PERMISSIONS.ATTENDANCE_MANAGE)
  @ResponseMessage('Attendance retrieved')
  listAttendance(@Param('id', new ParseUUIDPipe()) id: string, @Query() q: RangeDto) {
    return this.hr.listAttendance(id, q.from, q.to);
  }

  // ── Leave request ──────────────────────────────────────────────────────
  @Post(':id/leave')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @ResponseMessage('Leave requested')
  @ApiOperation({ summary: 'Submit a leave request for an employee' })
  requestLeave(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RequestLeaveDto) {
    return this.hr.requestLeave(id, dto);
  }

  // ── Shifts ─────────────────────────────────────────────────────────────
  @Get(':id/shifts')
  @Permissions(PERMISSIONS.ATTENDANCE_MANAGE)
  @ResponseMessage('Shifts retrieved')
  listShifts(@Param('id', new ParseUUIDPipe()) id: string, @Query() q: RangeDto) {
    return this.hr.listShifts(id, q.from, q.to);
  }

  // ── Payroll ────────────────────────────────────────────────────────────
  @Post(':id/payslips')
  @Permissions(PERMISSIONS.PAYROLL_MANAGE)
  @ResponseMessage('Payslip generated')
  @ApiOperation({ summary: 'Generate a payslip (net = base + allowances − deductions)' })
  generatePayslip(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: GeneratePayslipDto, @CurrentUser('id') userId: string) {
    return this.hr.generatePayslip(id, dto, userId);
  }
}
