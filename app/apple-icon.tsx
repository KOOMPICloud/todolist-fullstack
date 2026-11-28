// Added by KOOMPI Cloud: the iPhone's home-screen icon, drawn from brand.ts when the app builds.
import { drawIcon } from './app-icon/draw';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return drawIcon(180, 'apple');
}
