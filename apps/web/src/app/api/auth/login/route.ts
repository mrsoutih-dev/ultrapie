import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/user-store';
import { createSessionToken, setSessionCookie } from '@/lib/auth-cookie';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = verifyUserCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'These credentials do not match our records.' },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken({ id: user.id, email: user.email });

    // Return safe user profile and session token
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed,
      plan: user.plan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      token: sessionToken,
    };

    const res = NextResponse.json({
      success: true,
      user: safeUser,
    });

    // Set SSO cookie shared across .ultrapie.com and all subdomains
    setSessionCookie(res, sessionToken, req);

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
