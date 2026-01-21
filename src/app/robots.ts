import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/link-riot/',
          '/analysis/',
        ],
      },
    ],
    sitemap: 'https://nexra-ai.app/sitemap.xml',
  };
}
