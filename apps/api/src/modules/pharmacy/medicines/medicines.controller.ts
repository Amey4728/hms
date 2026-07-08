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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { CreateMedicineDto, MedicineQueryDto, UpdateMedicineDto } from './medicines.dto';
import { MedicinesService } from './medicines.service';

@ApiTags('Pharmacy · Medicines')
@ApiBearerAuth()
@Controller('pharmacy/medicines')
export class MedicinesController {
  constructor(private readonly service: MedicinesService) {}

  @Post()
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @ResponseMessage('Medicine created successfully')
  @ApiOperation({ summary: 'Add a medicine to the catalogue' })
  create(@Body() dto: CreateMedicineDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.PHARMACY_SALE_CREATE)
  @ResponseMessage('Medicines retrieved successfully')
  @ApiOperation({ summary: 'List the medicine catalogue' })
  list(@Query() query: MedicineQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.PHARMACY_SALE_CREATE)
  @ResponseMessage('Medicine retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @ResponseMessage('Medicine updated successfully')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMedicineDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Medicine deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }
}
