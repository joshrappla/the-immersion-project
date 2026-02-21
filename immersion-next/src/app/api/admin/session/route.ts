import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;

  const authenticated = !!secret && !!session && session === secret;
  return NextResponse.json({ authenticated });
}
