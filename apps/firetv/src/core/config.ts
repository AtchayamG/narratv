export interface AppConfig {
  demoMode: boolean;
  apiUrl: string;
  mediaCdnUrl: string;
  appRevision: string;
  version: string;
}

export const config: AppConfig = {
  // Default to true for judge-friendly no-key path per hackathon requirements
  demoMode: process.env.DEMO_MODE !== 'false',
  apiUrl: process.env.API_URL || '',
  mediaCdnUrl: process.env.MEDIA_CDN_URL || '',
  appRevision: process.env.APP_REVISION || '2026.09.02-build.1',
  version: '1.0.0'
};
