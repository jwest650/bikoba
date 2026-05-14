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

  const R2_KEYS = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_URL',
  ] as const;
  const r2Set = R2_KEYS.filter(
    (k) => typeof raw[k] === 'string' && raw[k] !== '',
  );
  if (r2Set.length > 0 && r2Set.length < R2_KEYS.length) {
    const missingR2 = R2_KEYS.filter((k) => !r2Set.includes(k));
    throw new Error(
      `Partial R2 configuration. Missing: ${missingR2.join(
        ', ',
      )}. Set all R2_* vars or leave them all blank to disable uploads.`,
    );
  }

  return raw;
}
