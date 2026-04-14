import appPackage from '../../package.json';

const packageVersion =
  typeof appPackage.version === 'string' && appPackage.version !== '0.0.0'
    ? appPackage.version
    : '0.1.0';

export const APP_METADATA = {
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? packageVersion,
  release: process.env.NEXT_PUBLIC_APP_RELEASE ?? 'c092a19',
  publishedAt: process.env.NEXT_PUBLIC_APP_PUBLISHED_AT ?? '09/04/2026',
} as const;
