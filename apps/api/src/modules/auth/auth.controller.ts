import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService, type AuthResult } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import type { RefreshContext } from './token.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ResponseMessage('Registration successful')
  @ApiOperation({ summary: 'Self-register a patient account' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, this.ctx(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'Authenticate and receive an access token' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.ctx(req));
    return this.respondWithSession(res, result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed')
  @ApiOperation({ summary: 'Rotate the refresh cookie and issue a new access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = this.readRefreshCookie(req);
    const result = await this.authService.refresh(raw, this.ctx(req));
    return this.respondWithSession(res, result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ResponseMessage('Logged out')
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieName = this.config.getOrThrow<string>('cookie.refreshName');
    await this.authService.logout(req.cookies?.[cookieName]);
    res.clearCookie(cookieName, this.cookieOptions());
    return null;
  }

  @Get('me')
  @ApiBearerAuth()
  @ResponseMessage('Current user retrieved')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  // ── helpers ──────────────────────────────────────────────────────────

  private respondWithSession(res: Response, result: AuthResult) {
    const cookieName = this.config.getOrThrow<string>('cookie.refreshName');
    res.cookie(cookieName, result.refresh.token, {
      ...this.cookieOptions(),
      expires: result.refresh.expiresAt,
    });
    return { user: result.user, accessToken: result.accessToken };
  }

  private readRefreshCookie(req: Request): string {
    const cookieName = this.config.getOrThrow<string>('cookie.refreshName');
    const raw = req.cookies?.[cookieName];
    if (!raw || typeof raw !== 'string') {
      throw new UnauthorizedException('Missing refresh token');
    }
    return raw;
  }

  private cookieOptions(): CookieOptions {
    const prefix = this.config.getOrThrow<string>('app.apiPrefix');
    const version = this.config.getOrThrow<string>('app.apiVersion');
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>('cookie.secure'),
      sameSite: 'lax',
      domain: this.config.getOrThrow<string>('cookie.domain'),
      path: `/${prefix}/${version}/auth`,
    };
  }

  private ctx(req: Request): RefreshContext {
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
  }
}
