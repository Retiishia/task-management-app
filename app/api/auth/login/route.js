import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 min per IP

    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = code;
      user.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendVerificationEmail({ to: user.email, name: user.name, code });

      return NextResponse.json(
        {
          success: false,
          requiresVerification: true,
          email: user.email,
          error: 'Your account is not verified yet. A 6-digit verification code has been sent to your email.',
        },
        { status: 403 }
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'member',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'member',
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to authenticate user', details: error.message },
      { status: 500 }
    );
  }
}
