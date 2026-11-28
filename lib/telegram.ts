/**
 * The app as a Telegram Mini App (a bot's app, t.me/<bot>), dormant elsewhere:
 * Telegram opens it with #tgWebAppData=… in the address, and only then does
 * Telegram's script load. components/telegram.tsx fits the app to Telegram.
 */

/** Runs in <head> (app/layout.tsx), before anything can change the address: in Telegram only, loads Telegram's script. */
export const telegramScript = `(function () {
  var opened = /[#&]tgWebAppData=/.test(location.hash);
  if (!opened) { try { opened = /tgWebAppData/.test(sessionStorage.getItem('__telegram__initParams') || ''); } catch (e) {} }
  if (!opened) return;
  window.__telegram = new Promise(function (resolve) {
    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = function () { var app = window.Telegram && window.Telegram.WebApp; resolve(app && app.initData ? app : null); };
    s.onerror = function () { resolve(null); };
    document.head.appendChild(s);
  });
})();
`;

/** The parts of Telegram's WebApp this app uses (core.telegram.org/bots/webapps has them all). */
export interface TelegramWebApp {
  /** What the server checks to know who this is (signed by Telegram); never trust initDataUnsafe for that. */
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string } };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isFullscreen?: boolean;
  ready(): void;
  expand(): void;
  isVersionAtLeast(version: string): boolean;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  onEvent(event: string, handler: () => void): void;
  offEvent(event: string, handler: () => void): void;
  BackButton: { show(): void; hide(): void; onClick(handler: () => void): void; offClick(handler: () => void): void };
  HapticFeedback?: { impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void; notificationOccurred(type: 'error' | 'success' | 'warning'): void };
}

declare global {
  interface Window {
    __telegram?: Promise<TelegramWebApp | null>;
  }
}

/** True when the app was opened in Telegram (known from the first paint, before Telegram's script has loaded). */
export function isTelegram(): boolean {
  return typeof window !== 'undefined' && !!window.__telegram;
}

/** Telegram's WebApp once its script has loaded; null outside Telegram. */
export function telegramApp(): Promise<TelegramWebApp | null> {
  if (typeof window === 'undefined' || !window.__telegram) return Promise.resolve(null);
  return window.__telegram;
}
