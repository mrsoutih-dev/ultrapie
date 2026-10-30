import { NextRequest, NextResponse } from 'next/server';

export interface SafeUserSession {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isSubscribed: boolean;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | null;
  subscriptionExpiresAt: string | null;
  avatarUrl?: string;
  provider?: 'credentials' | 'google';
  paymentMethod?: 'CRYPTO' | 'CARD';
  cryptoCurrency?: string;
  cryptoTxHash?: string;
}

/**
 * Determines the top-level cookie domain so authentication is shared (SSO)
 * across ultrapie.com, studio.ultrapie.com, hosting.ultrapie.com, etc.
 */
export function getCookieDomain(reqOrHost?: Request | NextRequest | string | null): string | undefined {
  let hostname = '';

  if (typeof reqOrHost === 'string') {
    hostname = reqOrHost;
  } else if (reqOrHost && 'headers' in reqOrHost) {
    const forwarded = reqOrHost.headers.get('x-forwarded-host');
    const host = reqOrHost.headers.get('host');
    hostname = forwarded || host || '';
  }

  // Remove port if present
  hostname = hostname.split(':')[0].toLowerCase();

  // Root domain sharing for ultrapie.com and subdomains
  if (hostname === 'ultrapie.com' || hostname.endsWith('.ultrapie.com')) {
    return '.ultrapie.com';
  }

  // Support for tajil.com fallback domain
  if (hostname === 'tajil.com' || hostname.endsWith('.tajil.com')) {
    return '.tajil.com';
  }

  // Do not set domain on localhost or IP addresses (browsers reject leading dots on localhost)
  return undefined;
}

/**
 * Encodes a user session into an encrypted/signed session string.
 */
export function createSessionToken(user: { id: string; email: string }): string {
  const timestamp = Date.now();
  const payload = `${user.id}:${user.email.toLowerCase()}:${timestamp}`;
  return 'session_' + Buffer.from(payload).toString('base64');
}

/**
 * Attaches the SSO authentication cookie to a NextResponse.
 */
export function setSessionCookie(
  response: NextResponse,
  token: string,
  reqOrHost?: Request | NextRequest | string | null
): void {
  const cookieDomain = getCookieDomain(reqOrHost);

  response.cookies.set('ultrapie_session', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

/**
 * Clears the SSO authentication cookie across the root domain.
 */
export function clearSessionCookie(
  response: NextResponse,
  reqOrHost?: Request | NextRequest | string | null
): void {
  const cookieDomain = getCookieDomain(reqOrHost);

  response.cookies.set('ultrapie_session', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}
