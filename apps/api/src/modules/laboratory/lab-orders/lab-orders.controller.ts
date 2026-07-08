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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import {
  CancelLabOrderDto,
  CreateLabOrderDto,
  EnterResultDto,
  LabOrderQueryDto,
  LabTransitionDto,
} from './lab-orders.dto';
import { LabOrdersService } from './lab-orders.service';

@ApiTags('Lab · Orders')
@ApiBearerAuth()
@Controller('lab/orders')
export class LabOrdersController {
  constructor(private readonly service: LabOrdersService) {}

  @Post()
  @Permissions(PERMISSIONS.LAB_RESULT_CREATE)
  @ResponseMessage('Lab order created successfully')
  @ApiOperation({ summary: 'Create a lab order with one or more tests' })
  create(@Body() dto: CreateLabOrderDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.LAB_RESULT_READ)
  @ResponseMessage('Lab orders retrieved successfully')
  @ApiOperation({ summary: 'List lab orders (filter by patient/status)' })
  list(@Query() query: LabOrderQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LAB_RESULT_READ)
  @ResponseMessage('Lab order retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Get(':id/report')
  @Permissions(PERMISSIONS.LAB_RESULT_READ)
  @ResponseMessage('Lab report retrieved successfully')
  @ApiOperation({ summary: 'Structured report for a COMPLETED order' })
  report(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.report(id);
  }

  @Patch(':id/collect-sample')
  @Permissions(PERMISSIONS.LAB_RESULT_CREATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Sample collected')
  @ApiOperation({ summary: 'Mark the sample as collected (ORDERED → SAMPLE_COLLECTED)' })
  collect(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LabTransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.collectSample(id, dto.version, userId);
  }

  @Patch(':id/start')
  @Permissions(PERMISSIONS.LAB_RESULT_CREATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Processing started')
  @ApiOperation({ summary: 'Start processing (SAMPLE_COLLECTED → IN_PROGRESS)' })
  start(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LabTransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.startProcessing(id, dto.version, userId);
  }

  @Patch(':id/complete')
  @Permissions(PERMISSIONS.LAB_RESULT_CREATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lab order completed')
  @ApiOperation({ summary: 'Complete the order (requires all results entered)' })
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LabTransitionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.complete(id, dto.version, userId);
  }

  @Patch(':id/cancel')
  @Permissions(PERMISSIONS.LAB_RESULT_CREATE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lab order cancelled')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelLabOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.cancel(id, dto, userId);
  }

  @Patch(':id/items/:itemId/result')
  @Permissions(PERMISSIONS.LAB_RESULT_CREATE)
  @ResponseMessage('Result recorded')
  @ApiOperation({ summary: 'Enter a result for one test in the order' })
  enterResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: EnterResultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.enterResult(id, itemId, dto, userId);
  }
}
