import { NextRequest, NextResponse } from 'next/server';
import { createOrLoginGoogleUser } from '@/lib/user-store';
import { createSessionToken, setSessionCookie } from '@/lib/auth-cookie';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, email, name, avatarUrl } = body;

    let googleEmail = email;
    let googleName = name;
    let googleAvatar = avatarUrl;
    let googleId = '';

    // If client provided a Google JWT credential (from Google One Tap or Sign In button)
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          googleEmail = payload.email || googleEmail;
          googleName = payload.name || googleName;
          googleAvatar = payload.picture || googleAvatar;
          googleId = payload.sub || '';
        }
      } catch (e) {
        console.warn('Failed to parse Google JWT credential:', e);
      }
    }

    if (!googleEmail) {
      return NextResponse.json(
        { 
          configured: Boolean(process.env.GOOGLE_CLIENT_ID),
          error: 'Google authentication requires a valid Google account credential or email. Google OAuth credentials have not been configured yet.' 
        },
        { status: 400 }
      );
    }

    googleId = googleId || 'gid_' + Buffer.from(googleEmail).toString('hex').substring(0, 12);
    googleName = googleName || googleEmail.split('@')[0];
    googleAvatar = googleAvatar || 'https://lh3.googleusercontent.com/a/default-user';

    const user = createOrLoginGoogleUser({
      id: googleId,
      name: googleName,
      email: googleEmail,
      avatarUrl: googleAvatar,
    });

    const sessionToken = createSessionToken({ id: user.id, email: user.email });

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSubscribed: user.isSubscribed,
        plan: user.plan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        avatarUrl: user.avatarUrl,
        provider: 'google',
      },
    });

    setSessionCookie(response, sessionToken, req);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Returns Google OAuth configuration status or redirects to Google Consent screen
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
    : 'http://localhost:3005/api/auth/callback/google';

  if (!clientId) {
    return NextResponse.json({
      configured: false,
      message: 'Google Cloud OAuth JSON or Client ID not yet set in .env.local',
      redirectUri,
    });
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
