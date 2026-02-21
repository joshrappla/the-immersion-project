import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    // Constant-time comparison prevents timing-based password oracle attacks
    const passwordBuf = Buffer.from(String(password));
    const expectedBuf = Buffer.from(expected);
    const match =
      passwordBuf.length === expectedBuf.length &&
      timingSafeEqual(passwordBuf, expectedBuf);

    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
    if (!sessionSecret) {
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('admin_session', sessionSecret, {
      httpOnly: true,                                    // not readable by JS
      secure: process.env.NODE_ENV === 'production',    // HTTPS only in prod
      sameSite: 'strict',                               // CSRF protection
      maxAge: 60 * 60 * 8,                              // 8-hour session
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
