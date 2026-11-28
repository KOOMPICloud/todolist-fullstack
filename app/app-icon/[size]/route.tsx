// Added by KOOMPI Cloud: the PNG icons manifest.ts lists, made once when the app builds.
import { drawIcon } from '../draw';

const SIZES = { '192': [192, 'any'], '512': [512, 'any'], maskable: [512, 'maskable'] } as const;

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const [px, kind] = SIZES[(await params).size as keyof typeof SIZES] ?? SIZES['512'];
  return drawIcon(px, kind);
}
