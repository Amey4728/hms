import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@hms/shared';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { DateRangeDto } from './reports.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Overview retrieved successfully')
  @ApiOperation({ summary: 'High-level KPIs across the platform' })
  overview() {
    return this.reports.overview();
  }

  @Get('revenue')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Revenue report retrieved successfully')
  @ApiOperation({ summary: 'Billing + pharmacy revenue (optional date range)' })
  revenue(@Query() q: DateRangeDto) {
    return this.reports.revenue(q);
  }

  @Get('appointments')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Appointment report retrieved successfully')
  appointments(@Query() q: DateRangeDto) {
    return this.reports.appointments(q);
  }

  @Get('patients')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Patient report retrieved successfully')
  patients() {
    return this.reports.patients();
  }

  @Get('doctors')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Doctor report retrieved successfully')
  doctors() {
    return this.reports.doctors();
  }

  @Get('inventory')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Inventory report retrieved successfully')
  inventory() {
    return this.reports.inventory();
  }

  @Get('occupancy')
  @Permissions(PERMISSIONS.REPORT_VIEW)
  @ResponseMessage('Occupancy report retrieved successfully')
  occupancy() {
    return this.reports.occupancy();
  }
}
