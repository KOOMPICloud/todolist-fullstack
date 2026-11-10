'use client';

import { useEffect, useEffectEvent } from 'react';
import { PENDING_SIGN_IN, SIGNED_IN, SIGN_IN_TTL_MS, isAuthenticated, startSignIn } from '@/lib/auth';

/**
 * A button whose action needs an account works for someone signed out too:
 * the action starts Sign in with KOOMPI ID itself and finishes once they are
 * back, signed in, with what they chose (DESIGN.md, Signing in):
 *
 *   const book = async (slot: string) => {
 *     if (!requireSignIn('book', { slot })) return; // signing in: useResumeAfterSignIn books it after
 *     ...book it, as the person now signed in
 *   };
 *   useResumeAfterSignIn<{ slot: string }>('book', ({ slot }) => book(slot));
 *
 * The action is kept in this tab (sessionStorage; Files at the payload's top
 * level, a photo, in IndexedDB) and goes on once: on the page it was started
 * from, after the very sign-in it started (popup or full page), within 10
 * minutes of the tap. A sign-in that is cancelled or fails leaves the page as
 * it was, and nothing goes on later.
 */

export type SignInPayload = Record<string, unknown>;

interface Saved {
  id: string;
  intent: string;
  payload: SignInPayload;
  files: string[];
  path: string;
  state: string;
  at: number;
}

const KEY = 'koompi_after_sign_in';
/** After the sign-in finishes, its page comes back in seconds: later than this, the action no longer goes on. */
const BACK_WITHIN_MS = 2 * 60 * 1000;

/**
 * True when signed in: do the action. Otherwise starts signing in, keeps
 * intent and payload for useResumeAfterSignIn, and returns false. Call it
 * first in the click handler, before any await (the popup needs the tap).
 */
export function requireSignIn(intent: string, payload: SignInPayload = {}): boolean {
  if (typeof window === 'undefined') return false;
  if (isAuthenticated()) return true;
  forget(read());
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const entries = Object.entries(payload);
  const files = Object.fromEntries(entries.filter(([, v]) => v instanceof Blob));
  const rest = Object.fromEntries(entries.filter(([, v]) => !(v instanceof Blob)));
  const kept = Object.keys(files).length
    ? fileStore('readwrite', (store) => {
        store.delete(IDBKeyRange.upperBound(String(Date.now() - SIGN_IN_TTL_MS))); // older ones, left behind
        return store.put(files, id);
      }).catch(() => undefined)
    : undefined;
  const state = startSignIn(kept);
  if (!state) {
    void kept?.then(() => forget({ id, files: Object.keys(files) }));
    return false;
  }
  const saved: Saved = { id, intent, payload: rest, files: Object.keys(files), path: window.location.pathname, state, at: Date.now() };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Storage is off: it still signs in, without going on.
  }
  return false;
}

/**
 * Finishes the action requireSignIn(intent) kept, once, after its sign-in,
 * with its payload. ready: false while the page still loads what the action
 * changes (the list it adds to), so the action isn't lost under it.
 */
export function useResumeAfterSignIn<T extends SignInPayload>(
  intent: string,
  handler: (payload: T) => unknown,
  ready = true,
) {
  const run = useEffectEvent((payload: SignInPayload) => handler(payload as T));
  useEffect(() => {
    if (!ready) return;
    void take(intent)?.then((payload) => run(payload));
  }, [intent, ready]);
}

function read(): Saved | null {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}

/** The kept action gone: from this tab, and its Files unless they are being taken. */
function forget(saved: Pick<Saved, 'id' | 'files'> | null, files = true) {
  if (!saved) return;
  try {
    if (read()?.id === saved.id) window.sessionStorage.removeItem(KEY);
  } catch {}
  if (files && saved.files.length) void fileStore('readwrite', (store) => store.delete(saved.id)).catch(() => undefined);
}

/** The kept action for intent, taken (it can't go on twice); null when there is none or it must not go on. */
function take(intent: string): Promise<SignInPayload> | null {
  const saved = read();
  if (!saved || saved.intent !== intent) return null;
  const stored = (key: string): { state?: string; at?: number } | null => {
    try {
      return JSON.parse(window.localStorage.getItem(key) ?? 'null');
    } catch {
      return null;
    }
  };
  const finished = stored(SIGNED_IN);
  const now = Date.now();
  const signedInNow = finished?.state === saved.state;
  // Its sign-in is still under way (the popup is open): leave it for the page that comes back.
  if (!signedInNow && stored(PENDING_SIGN_IN)?.state === saved.state && now - saved.at < SIGN_IN_TTL_MS) return null;
  const goesOn =
    signedInNow &&
    isAuthenticated() &&
    saved.path === window.location.pathname &&
    now - saved.at < SIGN_IN_TTL_MS &&
    now - (finished?.at ?? 0) < BACK_WITHIN_MS;
  forget(saved, !goesOn);
  if (!goesOn) return null;
  if (!saved.files.length) return Promise.resolve(saved.payload);
  return fileStore<Record<string, Blob>>('readwrite', (store) => {
    const got = store.get(saved.id);
    store.delete(saved.id);
    return got;
  })
    .catch(() => undefined)
    .then((files) => ({ ...saved.payload, ...Object.fromEntries(saved.files.map((k) => [k, files?.[k] ?? null])) }));
}

/** The Files of a kept action, in IndexedDB (sessionStorage keeps text only). */
function fileStore<R>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<R> | void): Promise<R | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('koompi-sign-in', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('files');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('files', mode);
      const request = work(tx.objectStore('files'));
      tx.oncomplete = () => {
        db.close();
        resolve(request ? request.result : undefined);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
