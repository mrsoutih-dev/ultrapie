import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth-cookie';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearSessionCookie(response, req);
  return response;
}
