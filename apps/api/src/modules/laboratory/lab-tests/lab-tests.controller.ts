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
import { CreateLabTestDto, LabTestQueryDto, UpdateLabTestDto } from './lab-tests.dto';
import { LabTestsService } from './lab-tests.service';

@ApiTags('Lab · Test Catalogue')
@ApiBearerAuth()
@Controller('lab/tests')
export class LabTestsController {
  constructor(private readonly service: LabTestsService) {}

  @Post()
  @Permissions(PERMISSIONS.LAB_TEST_MANAGE)
  @ResponseMessage('Lab test created successfully')
  @ApiOperation({ summary: 'Add a test to the catalogue' })
  create(@Body() dto: CreateLabTestDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.LAB_RESULT_READ)
  @ResponseMessage('Lab tests retrieved successfully')
  @ApiOperation({ summary: 'List the test catalogue' })
  list(@Query() query: LabTestQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LAB_RESULT_READ)
  @ResponseMessage('Lab test retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.LAB_TEST_MANAGE)
  @ResponseMessage('Lab test updated successfully')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLabTestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.LAB_TEST_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lab test deleted successfully')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }
}
