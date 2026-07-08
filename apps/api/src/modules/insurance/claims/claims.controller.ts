import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  PERMISSIONS,
  approveClaimSchema,
  claimStatusSchema,
  claimTransitionSchema,
  createClaimSchema,
  rejectClaimSchema,
} from '@hms/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';
import { ClaimsService } from './claims.service';

class CreateClaimDto extends createZodDto(createClaimSchema) {}
class TransitionDto extends createZodDto(claimTransitionSchema) {}
class ApproveDto extends createZodDto(approveClaimSchema) {}
class RejectDto extends createZodDto(rejectClaimSchema) {}
class ClaimQueryDto extends createZodDto(
  paginationQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    providerId: z.string().uuid().optional(),
    status: claimStatusSchema.optional(),
  }),
) {}

@ApiTags('Insurance · Claims')
@ApiBearerAuth()
@Controller('insurance/claims')
export class ClaimsController {
  constructor(private readonly service: ClaimsService) {}

  @Post()
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_CREATE)
  @ResponseMessage('Claim submitted successfully')
  @ApiOperation({ summary: 'Submit an insurance claim' })
  create(@Body() dto: CreateClaimDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_CREATE, PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @ResponseMessage('Claims retrieved successfully')
  @ApiOperation({ summary: 'List / track claims' })
  list(@Query() query: ClaimQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_CREATE, PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @ResponseMessage('Claim retrieved successfully')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/review')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Claim moved to review')
  review(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: TransitionDto, @CurrentUser('id') userId: string) {
    return this.service.review(id, dto.version, userId);
  }

  @Patch(':id/approve')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Claim approved')
  approve(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ApproveDto, @CurrentUser('id') userId: string) {
    return this.service.approve(id, dto, userId);
  }

  @Patch(':id/reject')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Claim rejected')
  reject(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RejectDto, @CurrentUser('id') userId: string) {
    return this.service.reject(id, dto, userId);
  }

  @Patch(':id/settle')
  @Permissions(PERMISSIONS.INSURANCE_CLAIM_APPROVE)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Claim settled')
  settle(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: TransitionDto, @CurrentUser('id') userId: string) {
    return this.service.settle(id, dto.version, userId);
  }
}
