import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ExpiryQueryDto, ReceiveBatchDto, StockQueryDto } from './inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Pharmacy · Inventory')
@ApiBearerAuth()
@Controller('pharmacy/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post('medicines/:medicineId/batches')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @ResponseMessage('Stock received successfully')
  @ApiOperation({ summary: 'Receive a stock batch for a medicine' })
  receive(
    @Param('medicineId', new ParseUUIDPipe()) medicineId: string,
    @Body() dto: ReceiveBatchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.receiveBatch(medicineId, dto, userId);
  }

  @Get('stock')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @ResponseMessage('Stock levels retrieved successfully')
  @ApiOperation({ summary: 'On-hand stock per medicine (with low-stock flag)' })
  stock(@Query() query: StockQueryDto) {
    return this.service.stockLevels(query);
  }

  @Get('alerts/low-stock')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @ResponseMessage('Low-stock alerts retrieved successfully')
  @ApiOperation({ summary: 'Medicines at or below their reorder level' })
  lowStock() {
    return this.service.lowStockAlerts();
  }

  @Get('alerts/expiring')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @ResponseMessage('Expiry alerts retrieved successfully')
  @ApiOperation({ summary: 'Batches expiring within N days (default 30)' })
  expiring(@Query() query: ExpiryQueryDto) {
    return this.service.expiringAlerts(query.days);
  }
}
