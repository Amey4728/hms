import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PERMISSIONS,
  adjustStockSchema,
  createInventoryItemSchema,
  createPurchaseRequestSchema,
  createTransferSchema,
  createVendorSchema,
  inventoryCategorySchema,
  purchaseDecisionSchema,
  purchaseStatusSchema,
  purchaseTransitionSchema,
  transferStatusSchema,
  transferTransitionSchema,
  updateInventoryItemSchema,
  updateVendorSchema,
} from '@hms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { paginationQuerySchema, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { InventoryService } from './inventory.service';

const M = PERMISSIONS.INVENTORY_MANAGE;

class CreateVendorDto extends createZodDto(createVendorSchema) {}
class UpdateVendorDto extends createZodDto(updateVendorSchema) {}
class CreateItemDto extends createZodDto(createInventoryItemSchema) {}
class UpdateItemDto extends createZodDto(updateInventoryItemSchema) {}
class AdjustStockDto extends createZodDto(adjustStockSchema) {}
class ItemQueryDto extends createZodDto(paginationQuerySchema.extend({ category: inventoryCategorySchema.optional() })) {}
class CreatePurchaseDto extends createZodDto(createPurchaseRequestSchema) {}
class PurchaseTransitionDto extends createZodDto(purchaseTransitionSchema) {}
class PurchaseDecisionDto extends createZodDto(purchaseDecisionSchema) {}
class PurchaseQueryDto extends createZodDto(paginationQuerySchema.extend({ status: purchaseStatusSchema.optional() })) {}
class CreateTransferDto extends createZodDto(createTransferSchema) {}
class TransferTransitionDto extends createZodDto(transferTransitionSchema) {}
class TransferQueryDto extends createZodDto(paginationQuerySchema.extend({ status: transferStatusSchema.optional() })) {}

@ApiTags('Inventory · Vendors')
@ApiBearerAuth()
@Controller('inventory/vendors')
export class VendorsController {
  constructor(private readonly service: InventoryService) {}
  @Post() @Permissions(M) @ResponseMessage('Vendor created successfully')
  create(@Body() dto: CreateVendorDto, @CurrentUser('id') u: string) { return this.service.createVendor(dto, u); }
  @Get() @Permissions(M) @ResponseMessage('Vendors retrieved successfully')
  list(@Query() q: PaginationQueryDto) { return this.service.listVendors(q); }
  @Get(':id') @Permissions(M) @ResponseMessage('Vendor retrieved successfully')
  get(@Param('id', new ParseUUIDPipe()) id: string) { return this.service.getVendor(id); }
  @Patch(':id') @Permissions(M) @ResponseMessage('Vendor updated successfully')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateVendorDto, @CurrentUser('id') u: string) { return this.service.updateVendor(id, dto, u); }
  @Delete(':id') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Vendor deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') u: string) { return this.service.removeVendor(id, u); }
}

@ApiTags('Inventory · Items')
@ApiBearerAuth()
@Controller('inventory/items')
export class ItemsController {
  constructor(private readonly service: InventoryService) {}
  @Post() @Permissions(M) @ResponseMessage('Item created successfully')
  create(@Body() dto: CreateItemDto, @CurrentUser('id') u: string) { return this.service.createItem(dto, u); }
  @Get() @Permissions(M) @ResponseMessage('Items retrieved successfully')
  list(@Query() q: ItemQueryDto) { return this.service.listItems(q); }
  @Get('alerts/low-stock') @Permissions(M) @ResponseMessage('Low-stock items retrieved')
  @ApiOperation({ summary: 'Items at or below reorder level' })
  lowStock() { return this.service.lowStock(); }
  @Get(':id') @Permissions(M) @ResponseMessage('Item retrieved successfully')
  get(@Param('id', new ParseUUIDPipe()) id: string) { return this.service.getItem(id); }
  @Patch(':id') @Permissions(M) @ResponseMessage('Item updated successfully')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateItemDto, @CurrentUser('id') u: string) { return this.service.updateItem(id, dto, u); }
  @Patch(':id/adjust') @Permissions(M) @ResponseMessage('Stock adjusted')
  @ApiOperation({ summary: 'Adjust on-hand stock by a signed delta' })
  adjust(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: AdjustStockDto, @CurrentUser('id') u: string) { return this.service.adjustStock(id, dto, u); }
  @Delete(':id') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Item deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') u: string) { return this.service.removeItem(id, u); }
}

@ApiTags('Inventory · Purchase Requests')
@ApiBearerAuth()
@Controller('inventory/purchase-requests')
export class PurchaseRequestsController {
  constructor(private readonly service: InventoryService) {}
  @Post() @Permissions(M) @ResponseMessage('Purchase request created successfully')
  create(@Body() dto: CreatePurchaseDto, @CurrentUser('id') u: string) { return this.service.createPurchase(dto, u); }
  @Get() @Permissions(M) @ResponseMessage('Purchase requests retrieved successfully')
  list(@Query() q: PurchaseQueryDto) { return this.service.listPurchases(q); }
  @Get(':id') @Permissions(M) @ResponseMessage('Purchase request retrieved successfully')
  get(@Param('id', new ParseUUIDPipe()) id: string) { return this.service.getPurchase(id); }
  @Patch(':id/submit') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Purchase request submitted')
  submit(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: PurchaseTransitionDto, @CurrentUser('id') u: string) { return this.service.submitPurchase(id, dto.version, u); }
  @Patch(':id/approve') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Purchase request approved')
  approve(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: PurchaseDecisionDto, @CurrentUser('id') u: string) { return this.service.approvePurchase(id, dto, u); }
  @Patch(':id/reject') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Purchase request rejected')
  reject(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: PurchaseDecisionDto, @CurrentUser('id') u: string) { return this.service.rejectPurchase(id, dto, u); }
  @Patch(':id/receive') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Purchase received (stock updated)')
  @ApiOperation({ summary: 'Receive an approved request → increments item stock' })
  receive(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: PurchaseTransitionDto, @CurrentUser('id') u: string) { return this.service.receivePurchase(id, dto.version, u); }
}

@ApiTags('Inventory · Stock Transfers')
@ApiBearerAuth()
@Controller('inventory/transfers')
export class TransfersController {
  constructor(private readonly service: InventoryService) {}
  @Post() @Permissions(M) @ResponseMessage('Transfer created successfully')
  create(@Body() dto: CreateTransferDto, @CurrentUser('id') u: string) { return this.service.createTransfer(dto, u); }
  @Get() @Permissions(M) @ResponseMessage('Transfers retrieved successfully')
  list(@Query() q: TransferQueryDto) { return this.service.listTransfers(q); }
  @Patch(':id/complete') @Permissions(M) @HttpCode(HttpStatus.OK) @ResponseMessage('Transfer completed')
  complete(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: TransferTransitionDto) { return this.service.completeTransfer(id, dto.version); }
}
