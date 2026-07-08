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
  createShiftSchema,
  leaveDecisionSchema,
  payslipStatusSchema,
} from '@hms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../common/dto/pagination.dto';
import { HrService } from './hr.service';

class CreateShiftDto extends createZodDto(createShiftSchema) {}
class LeaveDecisionDto extends createZodDto(leaveDecisionSchema) {}
class PayslipStatusDto extends createZodDto(payslipStatusSchema) {}
class LeaveQueryDto extends createZodDto(
  paginationQuerySchema.extend({
    employeeId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),
) {}
class PayslipQueryDto extends createZodDto(
  paginationQuerySchema.extend({
    employeeId: z.string().uuid().optional(),
    period: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional(),
  }),
) {}

@ApiTags('HR · Leave, Shifts & Payroll')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get('leave')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @ResponseMessage('Leave requests retrieved')
  listLeave(@Query() query: LeaveQueryDto) {
    return this.hr.listLeave(query);
  }

  @Patch('leave/:id/approve')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Leave approved')
  approveLeave(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LeaveDecisionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hr.decideLeave(id, true, dto, userId);
  }

  @Patch('leave/:id/reject')
  @Permissions(PERMISSIONS.STAFF_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Leave rejected')
  rejectLeave(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LeaveDecisionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hr.decideLeave(id, false, dto, userId);
  }

  @Post('shifts')
  @Permissions(PERMISSIONS.ATTENDANCE_MANAGE)
  @ResponseMessage('Shift scheduled')
  @ApiOperation({ summary: 'Schedule a shift for an employee' })
  createShift(@Body() dto: CreateShiftDto, @CurrentUser('id') userId: string) {
    return this.hr.createShift(dto, userId);
  }

  @Get('payslips')
  @Permissions(PERMISSIONS.PAYROLL_MANAGE)
  @ResponseMessage('Payslips retrieved')
  listPayslips(@Query() query: PayslipQueryDto) {
    return this.hr.listPayslips(query);
  }

  @Patch('payslips/:id/status')
  @Permissions(PERMISSIONS.PAYROLL_MANAGE)
  @ResponseMessage('Payslip status updated')
  @ApiOperation({ summary: 'Move a payslip DRAFT → FINALIZED → PAID' })
  setPayslipStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PayslipStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hr.setPayslipStatus(id, dto, userId);
  }
}
