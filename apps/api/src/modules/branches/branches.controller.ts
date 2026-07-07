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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { BranchesService } from './branches.service';
import { BranchQueryDto, CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Post()
  @Permissions(PERMISSIONS.BRANCH_CREATE)
  @ResponseMessage('Branch created successfully')
  @ApiOperation({ summary: 'Create a branch under a hospital' })
  create(@Body() dto: CreateBranchDto, @CurrentUser('id') userId: string) {
    return this.branches.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.BRANCH_READ)
  @ResponseMessage('Branches retrieved successfully')
  @ApiOperation({ summary: 'List branches (filter by hospitalId)' })
  list(@Query() query: BranchQueryDto) {
    return this.branches.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.BRANCH_READ)
  @ResponseMessage('Branch retrieved successfully')
  @ApiOperation({ summary: 'Get a branch by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.branches.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.BRANCH_UPDATE)
  @ResponseMessage('Branch updated successfully')
  @ApiOperation({ summary: 'Update a branch (optimistic lock via version)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.branches.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.BRANCH_DELETE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Branch deleted successfully')
  @ApiOperation({ summary: 'Soft-delete a branch (blocked if it has departments)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') userId: string) {
    return this.branches.remove(id, userId);
  }
}
