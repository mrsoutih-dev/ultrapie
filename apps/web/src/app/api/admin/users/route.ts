import { NextResponse } from 'next/server';
import { updateUserByAdmin } from '@/lib/user-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, plan, isSubscribed, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updated = updateUserByAdmin(userId, {
      ...(plan !== undefined && { plan }),
      ...(isSubscribed !== undefined && { isSubscribed }),
      ...(role !== undefined && { role }),
      ...(isSubscribed && { subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() }),
    });

    const { passwordHash, salt, ...safeUser } = updated;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
