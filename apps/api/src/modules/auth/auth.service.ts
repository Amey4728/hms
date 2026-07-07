import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { DEFAULT_SELF_REGISTER_ROLE } from '@hms/shared';
import type { AccessTokenPayload } from '../../common/types/authenticated-user';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { resolveRbac, toUserView, type UserView } from '../users/users.mapper';
import { UsersRepository, type UserWithRbac } from '../users/users.repository';
import type { RegisterInput, LoginInput } from '@hms/shared';
import { TokenService, type IssuedRefreshToken, type RefreshContext } from './token.service';

export interface AuthResult {
  user: UserView;
  accessToken: string;
  refresh: IssuedRefreshToken;
}

const ARGON2_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersRepository,
    private readonly rbac: RbacService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterInput, ctx: RefreshContext): Promise<AuthResult> {
    const existing = await this.users.findByEmailWithRbac(dto.email);
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTS);
    let user = await this.users.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    const defaultRole = await this.rbac.getRoleByName(DEFAULT_SELF_REGISTER_ROLE);
    await this.rbac.assignRoleToUser(user.id, defaultRole.id);

    const reloaded = await this.users.findByIdWithRbac(user.id);
    if (reloaded) user = reloaded;

    await this.recordLogin(user.email, true, ctx, user.id);
    return this.issueSession(user, ctx);
  }

  async login(dto: LoginInput, ctx: RefreshContext): Promise<AuthResult> {
    const user = await this.users.findByEmailWithRbac(dto.email);

    if (!user) {
      await this.recordLogin(dto.email, false, ctx, null, 'USER_NOT_FOUND');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await this.recordLogin(dto.email, false, ctx, user.id, 'ACCOUNT_LOCKED');
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.handleFailedPassword(user, ctx);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      await this.recordLogin(dto.email, false, ctx, user.id, `STATUS_${user.status}`);
      throw new UnauthorizedException('Account is not active');
    }

    await this.users.recordSuccessfulLogin(user.id);
    await this.recordLogin(dto.email, true, ctx, user.id);
    return this.issueSession(user, ctx);
  }

  async refresh(rawToken: string, ctx: RefreshContext): Promise<AuthResult> {
    const { userId, refresh } = await this.tokens.rotateRefreshToken(rawToken, ctx);
    const user = await this.users.findByIdWithRbac(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session is no longer valid');
    }
    const accessToken = this.tokens.issueAccessToken(this.buildPayload(user));
    return { user: toUserView(user), accessToken, refresh };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (rawToken) await this.tokens.revokeRefreshToken(rawToken);
  }

  // ── internals ──────────────────────────────────────────────────────────

  private async handleFailedPassword(user: UserWithRbac, ctx: RefreshContext): Promise<void> {
    const max = this.config.getOrThrow<number>('security.maxFailedLogins');
    const lockMinutes = this.config.getOrThrow<number>('security.accountLockMinutes');
    const willLock = user.failedLoginAttempts + 1 >= max;
    const lockUntil = willLock ? new Date(Date.now() + lockMinutes * 60_000) : null;
    await this.users.registerFailedLogin(user.id, lockUntil);
    await this.recordLogin(user.email, false, ctx, user.id, willLock ? 'LOCKED_OUT' : 'BAD_PASSWORD');
  }

  private async issueSession(user: UserWithRbac, ctx: RefreshContext): Promise<AuthResult> {
    const accessToken = this.tokens.issueAccessToken(this.buildPayload(user));
    const refresh = await this.tokens.issueRefreshToken(user.id, ctx);
    return { user: toUserView(user), accessToken, refresh };
  }

  private buildPayload(user: UserWithRbac): AccessTokenPayload {
    const { roles, permissions } = resolveRbac(user);
    return {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
    };
  }

  private async recordLogin(
    email: string,
    success: boolean,
    ctx: RefreshContext,
    userId: string | null,
    reason?: string,
  ): Promise<void> {
    await this.prisma.loginHistory.create({
      data: {
        email,
        success,
        reason,
        userId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });
  }
}
