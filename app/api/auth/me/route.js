import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authUser = getAuthUser(request);

  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: authUser.userId,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role || 'member',
    },
  });
}
