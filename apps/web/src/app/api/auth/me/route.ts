import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, getUserStore } from '@/lib/user-store';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('ultrapie_session')?.value;
    const authHeader = req.headers.get('authorization');
    const token = sessionCookie || authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Decode session token
    if (token.startsWith('session_')) {
      const b64 = token.replace('session_', '');
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      const [, email] = decoded.split(':');

      if (email) {
        const user = findUserByEmail(email);
        if (user) {
          return NextResponse.json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isSubscribed: user.isSubscribed,
              plan: user.plan,
              subscriptionExpiresAt: user.subscriptionExpiresAt,
            },
          });
        }
      }
    }

    return NextResponse.json({ user: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
