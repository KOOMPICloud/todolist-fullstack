'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { signInFromTelegram } from '@/lib/auth';
import { telegramApp, type TelegramWebApp } from '@/lib/telegram';

/** A color the page uses (a CSS variable) as #rrggbb, the only form Telegram takes; null when the browser can't say. */
function hexOf(variable: string): string | null {
  const probe = document.createElement('div');
  probe.style.cssText = `position:absolute;visibility:hidden;background:var(${variable})`;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const paint = canvas.getContext('2d', { willReadFrequently: true });
  if (!paint) return null;
  paint.fillStyle = color;
  paint.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = paint.getImageData(0, 0, 1, 1).data;
  if (a < 255) return null;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * In Telegram (lib/telegram.ts), the app fits it: signed in by itself (lib/auth.ts signInFromTelegram), full height, Telegram's bars
 * in the app's colors (again when light/dark switches), Telegram's back button
 * on any page but the first, and links to other sites in Telegram's browser.
 * In app/layout.tsx; outside Telegram it does nothing.
 */
export function TelegramFrame() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [app, setApp] = useState<TelegramWebApp | null>(null);
  // Pages moved through in the app, so the back button goes back only to the app's own pages.
  const depth = useRef(-1);
  const goingBack = useRef(false);

  useEffect(() => {
    let live = true;
    void telegramApp().then((found) => {
      if (!live || !found) return;
      found.ready();
      found.expand();
      setApp(found);
      signInFromTelegram();
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!app) return;
    const root = document.documentElement;
    const paint = () => {
      const bar = hexOf('--nav');
      const page = hexOf('--background');
      if (!app.isVersionAtLeast('6.1')) return;
      if (bar) app.setHeaderColor(bar);
      if (page) app.setBackgroundColor(page);
      if (page && app.isVersionAtLeast('7.10')) app.setBottomBarColor?.(page);
    };
    // Full screen puts Telegram's buttons over the top of the page: --safe-top (app/globals.css) makes room.
    const fullscreen = () => root.classList.toggle('tg-fullscreen', !!app.isFullscreen);
    paint();
    fullscreen();
    const watch = new MutationObserver(paint);
    watch.observe(root, { attributes: true, attributeFilter: ['class'] });
    app.onEvent('fullscreenChanged', fullscreen);
    return () => {
      watch.disconnect();
      app.offEvent('fullscreenChanged', fullscreen);
    };
  }, [app]);

  useEffect(() => {
    depth.current = goingBack.current ? Math.max(0, depth.current - 1) : depth.current + 1;
    goingBack.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!app || !app.isVersionAtLeast('6.1')) return;
    if (pathname !== '/' || depth.current > 0) app.BackButton.show();
    else app.BackButton.hide();
    const back = () => {
      goingBack.current = true;
      if (depth.current > 0) router.back();
      else router.replace('/');
    };
    app.BackButton.onClick(back);
    return () => app.BackButton.offClick(back);
  }, [app, pathname, router]);

  useEffect(() => {
    if (!app) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin === window.location.origin || !/^https?:$/.test(url.protocol)) return;
      event.preventDefault();
      if (url.hostname === 't.me') app.openTelegramLink(url.href);
      else app.openLink(url.href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [app]);

  return null;
}
