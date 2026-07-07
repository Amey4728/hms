import type { EnvVars } from './env.validation';

/**
 * Strongly-typed configuration namespaces derived from validated env vars.
 * Consumed via ConfigService with dot-paths, e.g. config.get('jwt.accessSecret').
 */
export const appConfig = (env: EnvVars) => ({
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    apiVersion: env.API_VERSION,
    corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    isProduction: env.NODE_ENV === 'production',
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshTtlDays: env.JWT_REFRESH_TTL_DAYS,
  },
  cookie: {
    secret: env.COOKIE_SECRET,
    refreshName: env.REFRESH_COOKIE_NAME,
    domain: env.COOKIE_DOMAIN,
    secure: env.COOKIE_SECURE,
  },
  security: {
    throttleTtlSeconds: env.THROTTLE_TTL_SECONDS,
    throttleLimit: env.THROTTLE_LIMIT,
    maxFailedLogins: env.MAX_FAILED_LOGINS,
    accountLockMinutes: env.ACCOUNT_LOCK_MINUTES,
  },
  seed: {
    superAdminEmail: env.SEED_SUPERADMIN_EMAIL,
    superAdminPassword: env.SEED_SUPERADMIN_PASSWORD,
  },
});

export type AppConfig = ReturnType<typeof appConfig>;
