// Added by KOOMPI Cloud: the app's icon as a PNG (next/og), drawn from ../brand.ts when the app builds.
import { ImageResponse } from 'next/og';
import { brand } from '../brand';

/**
 * any: rounded like icon.svg. maskable: edge to edge, the letter inside the
 * middle 80% (Android crops it to a circle or a squircle). apple: edge to
 * edge (the iPhone rounds it; a see-through corner turns black).
 */
export function drawIcon(size: number, kind: 'any' | 'maskable' | 'apple'): ImageResponse {
  const corner = kind === 'any' ? Math.round((brand.radius * 3.5 * size) / 512) : 0;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: brand.accent,
          borderRadius: corner,
          color: brand.onAccent,
          fontSize: Math.round(size * (kind === 'maskable' ? 0.42 : 0.58)),
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {brand.letter}
      </div>
    ),
    { width: size, height: size },
  );
}
