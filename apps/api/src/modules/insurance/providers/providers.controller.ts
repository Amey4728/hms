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
import { createZodDto } from 'nestjs-zod';
import { PERMISSIONS, createProviderSchema, updateProviderSchema } from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ProvidersService } from './providers.service';

class CreateProviderDto extends createZodDto(createProviderSchema) {}
class UpdateProviderDto extends createZodDto(updateProviderSchema) {}

@ApiTags('Insurance · Providers')
@ApiBearerAuth()
@Controller('insurance/providers')
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Post()
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @ResponseMessage('Provider created successfully')
  @ApiOperation({ summary: 'Add an insurance provider' })
  create(@Body() dto: CreateProviderDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_CREATE, PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @ResponseMessage('Providers retrieved successfully')
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_CREATE, PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @ResponseMessage('Provider retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @ResponseMessage('Provider updated successfully')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProviderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Provider deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }
}
