import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/user-store';

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

    // Return safe user profile and session token
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed,
      plan: user.plan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      token: 'session_' + Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64'),
    };

    const res = NextResponse.json({
      success: true,
      user: safeUser,
    });

    // Set cookie for convenience
    res.cookies.set('ultrapie_session', safeUser.token, {
      path: '/',
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
