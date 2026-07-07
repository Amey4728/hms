import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@hms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RbacService } from './rbac.service';

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('roles')
  @Permissions(PERMISSIONS.ROLE_READ)
  @ResponseMessage('Roles retrieved successfully')
  @ApiOperation({ summary: 'List all roles and their permissions' })
  listRoles() {
    return this.rbac.listRoles();
  }

  @Get('permissions')
  @Permissions(PERMISSIONS.PERMISSION_READ)
  @ResponseMessage('Permissions retrieved successfully')
  @ApiOperation({ summary: 'List the full permission catalogue' })
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @Post('assign-role')
  @Permissions(PERMISSIONS.ROLE_ASSIGN)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Role assigned successfully')
  @ApiOperation({ summary: 'Assign a role to a user' })
  async assignRole(@Body() dto: AssignRoleDto, @CurrentUser('id') actorId: string) {
    await this.rbac.assignRoleToUser(dto.userId, dto.roleId, actorId);
    return { userId: dto.userId, roleId: dto.roleId };
  }

  @Delete('assign-role')
  @Permissions(PERMISSIONS.ROLE_ASSIGN)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Role removed successfully')
  @ApiOperation({ summary: 'Remove a role from a user' })
  async removeRole(@Body() dto: AssignRoleDto) {
    await this.rbac.removeRoleFromUser(dto.userId, dto.roleId);
    return { userId: dto.userId, roleId: dto.roleId };
  }
}
