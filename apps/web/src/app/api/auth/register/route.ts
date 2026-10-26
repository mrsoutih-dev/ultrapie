import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const displayName = (name && name.trim()) || email.split('@')[0];
    const user = createUser(displayName, email, password);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed, // False initially until monthly subscription is activated
      plan: user.plan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      token: 'session_' + Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64'),
    };

    const res = NextResponse.json({
      success: true,
      message: 'Account created successfully! Please select your monthly subscription plan to activate full access.',
      user: safeUser,
      requiresSubscription: true,
    });

    res.cookies.set('ultrapie_session', safeUser.token, {
      path: '/',
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
