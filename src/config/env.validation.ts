const REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_KEYS.filter(
    (key) => typeof raw[key] !== 'string' || raw[key] === '',
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ', ',
      )}. Copy .env.example to .env and fill in values.`,
    );
  }
  if (
    raw.JWT_ACCESS_SECRET === raw.JWT_REFRESH_SECRET &&
    raw.NODE_ENV === 'production'
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different in production.',
    );
  }
  return raw;
}
