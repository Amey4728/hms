import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { CreateSaleDto, SaleQueryDto } from './sales.dto';
import { SalesService } from './sales.service';

@ApiTags('Pharmacy · Sales')
@ApiBearerAuth()
@Controller('pharmacy/sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  @Permissions(PERMISSIONS.PHARMACY_SALE_CREATE)
  @ResponseMessage('Sale recorded successfully')
  @ApiOperation({ summary: 'Record a sale (FEFO stock decrement + totals)' })
  create(@Body() dto: CreateSaleDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.PHARMACY_SALE_CREATE)
  @ResponseMessage('Sales retrieved successfully')
  @ApiOperation({ summary: 'List sales' })
  list(@Query() query: SaleQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PHARMACY_SALE_CREATE)
  @ResponseMessage('Sale retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }
}
