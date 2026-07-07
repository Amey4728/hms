import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@hms/shared';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  @ResponseMessage('Users retrieved successfully')
  @ApiOperation({ summary: 'List users (paginated, filterable, sortable)' })
  list(@Query() query: PaginationQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  @ResponseMessage('User retrieved successfully')
  @ApiOperation({ summary: 'Get a user by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findById(id);
  }
}
