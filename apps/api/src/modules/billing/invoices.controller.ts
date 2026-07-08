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
import {
  CancelInvoiceDto,
  CreateInvoiceDto,
  InvoiceQueryDto,
  RecordPaymentDto,
  RefundDto,
} from './invoices.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('Billing · Invoices')
@ApiBearerAuth()
@Controller('billing/invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  @Permissions(PERMISSIONS.BILLING_GENERATE)
  @ResponseMessage('Invoice generated successfully')
  @ApiOperation({ summary: 'Generate an invoice with line items (computes totals)' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.BILLING_READ)
  @ResponseMessage('Invoices retrieved successfully')
  @ApiOperation({ summary: 'List invoices (filter by patient/status)' })
  list(@Query() query: InvoiceQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.BILLING_READ)
  @ResponseMessage('Invoice retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Post(':id/payments')
  @Permissions(PERMISSIONS.BILLING_GENERATE)
  @ResponseMessage('Payment recorded successfully')
  @ApiOperation({ summary: 'Record a payment (updates balance + status)' })
  pay(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RecordPaymentDto, @CurrentUser('id') userId: string) {
    return this.service.recordPayment(id, dto, userId);
  }

  @Post(':id/refunds')
  @Permissions(PERMISSIONS.BILLING_REFUND)
  @ResponseMessage('Refund recorded successfully')
  @ApiOperation({ summary: 'Refund against an invoice' })
  refund(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RefundDto, @CurrentUser('id') userId: string) {
    return this.service.refund(id, dto, userId);
  }

  @Patch(':id/cancel')
  @Permissions(PERMISSIONS.BILLING_GENERATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Invoice cancelled')
  @ApiOperation({ summary: 'Cancel an unpaid invoice' })
  cancel(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CancelInvoiceDto, @CurrentUser('id') userId: string) {
    return this.service.cancel(id, dto, userId);
  }
}
