import { NextResponse } from 'next/server';
import { getStudioStats, getActionLogsStore, getAllUsers } from '@/lib/user-store';

export async function GET(req: Request) {
  try {
    const stats = getStudioStats();
    const actions = getActionLogsStore().slice(0, 50);
    const users = getAllUsers().map(({ passwordHash, salt, ...safeUser }) => safeUser);

    return NextResponse.json({
      success: true,
      stats,
      recentActions: actions,
      users,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
