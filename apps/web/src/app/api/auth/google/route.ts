import { NextResponse } from 'next/server';
import { createOrLoginGoogleUser } from '@/lib/user-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, email, name, avatarUrl } = body;

    // If client supplied user details directly (from Google One Tap or Client OAuth)
    const googleEmail = email || 'zohodigital.com@gmail.com';
    const googleName = name || (googleEmail.includes('zohodigital') ? 'Elhoussine Soutih' : 'Google User');
    const googleId = 'gid_' + Math.random().toString(36).substring(2, 12);

    const user = createOrLoginGoogleUser({
      id: googleId,
      name: googleName,
      email: googleEmail,
      avatarUrl: avatarUrl || 'https://lh3.googleusercontent.com/a/default-user',
    });

    const token = 'tok_g_' + Math.random().toString(36).substring(2, 15);

    const response = NextResponse.json({
      success: true,
      token,
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

    response.cookies.set('ultrapie_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

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
