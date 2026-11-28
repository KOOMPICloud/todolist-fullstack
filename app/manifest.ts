import type { MetadataRoute } from 'next';
import { brand } from './brand';

// Added by KOOMPI Cloud (design_app rewrites it): the app installs to a phone's home screen and opens like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: brand.name,
    short_name: brand.shortName,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: brand.bg,
    theme_color: brand.bg,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/app-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app-icon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
