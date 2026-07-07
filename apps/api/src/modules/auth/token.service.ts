import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AccessTokenPayload } from '../../common/types/authenticated-user';

export interface RefreshContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedRefreshToken {
  token: string; // opaque raw token (sent to client via cookie)
  expiresAt: Date;
}

/**
 * Issues and rotates tokens.
 *  - Access token: stateless JWT carrying the resolved permission set.
 *  - Refresh token: opaque random value; only its sha256 hash is stored.
 *    Rotation revokes the old token and detects reuse via the token family.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  issueAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.getOrThrow<string>('jwt.accessTtl'),
    });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private expiryDate(): Date {
    const days = this.config.getOrThrow<number>('jwt.refreshTtlDays');
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async issueRefreshToken(
    userId: string,
    ctx: RefreshContext,
    family?: string,
  ): Promise<IssuedRefreshToken> {
    const token = randomBytes(48).toString('hex');
    const expiresAt = this.expiryDate();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        family: family ?? randomUUID(),
        expiresAt,
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
      },
    });
    return { token, expiresAt };
  }

  /**
   * Validates + rotates a refresh token. Returns the userId and a freshly
   * issued refresh token. Detects reuse of an already-revoked token.
   */
  async rotateRefreshToken(
    rawToken: string,
    ctx: RefreshContext,
  ): Promise<{ userId: string; refresh: IssuedRefreshToken }> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });

    if (!record) throw new UnauthorizedException('Invalid refresh token');

    if (record.revokedAt) {
      // Reuse of a revoked token → assume theft, revoke the whole family.
      await this.prisma.refreshToken.updateMany({
        where: { family: record.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const next = await this.issueRefreshToken(record.userId, ctx, record.family);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: (
          await this.prisma.refreshToken.findFirstOrThrow({
            where: { tokenHash: this.hash(next.token) },
            select: { id: true },
          })
        ).id,
      },
    });

    return { userId: record.userId, refresh: next };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
