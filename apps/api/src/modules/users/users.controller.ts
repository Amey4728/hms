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
import { CreateUserDto, UpdateUserDto, UpdateUserStatusDto, UsersQueryDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions(PERMISSIONS.USER_CREATE)
  @ResponseMessage('User created successfully')
  @ApiOperation({ summary: 'Create a staff user and assign roles' })
  create(@Body() dto: CreateUserDto, @CurrentUser('id') actorId: string) {
    return this.usersService.create(dto, actorId);
  }

  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  @ResponseMessage('Users retrieved successfully')
  @ApiOperation({ summary: 'List users (paginated, filter by search + role)' })
  list(@Query() query: UsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  @ResponseMessage('User retrieved successfully')
  @ApiOperation({ summary: 'Get a user by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.USER_UPDATE)
  @ResponseMessage('User updated successfully')
  @ApiOperation({ summary: 'Update a user profile (optimistic lock)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.update(id, dto, actorId);
  }

  @Patch(':id/status')
  @Permissions(PERMISSIONS.USER_UPDATE)
  @ResponseMessage('User status updated successfully')
  @ApiOperation({ summary: 'Activate / suspend / deactivate a user (revokes sessions)' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.updateStatus(id, dto, actorId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.USER_DELETE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('User deleted successfully')
  @ApiOperation({ summary: 'Soft-delete a user (revokes sessions)' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser('id') actorId: string) {
    return this.usersService.remove(id, actorId);
  }
}
