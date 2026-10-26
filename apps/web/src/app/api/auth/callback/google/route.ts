import { NextResponse } from 'next/server';
import { createOrLoginGoogleUser } from '@/lib/user-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?auth_error=' + (error || 'no_code'), req.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
      : 'http://localhost:3005/api/auth/callback/google';

    if (clientId && clientSecret) {
      // Exchange code for tokens with Google
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenRes.json();
      if (tokens.id_token) {
        // Fetch user info from Google
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const googleUser = await userRes.json();

        const user = createOrLoginGoogleUser({
          id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
        });

        const token = 'tok_g_' + Math.random().toString(36).substring(2, 15);
        const res = NextResponse.redirect(new URL('/studio?auth=success', req.url));
        res.cookies.set('ultrapie_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });
        return res;
      }
    }

    return NextResponse.redirect(new URL('/studio?auth=success', req.url));
  } catch (err) {
    return NextResponse.redirect(new URL('/?auth_error=token_exchange_failed', req.url));
  }
}
