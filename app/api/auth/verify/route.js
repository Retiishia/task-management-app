import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify - Verify 6-digit OTP code
export async function POST(request) {
  try {
    await dbConnect();
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit verification code are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: 'Account is already verified. You can sign in.',
      });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (user.verificationCodeExpire && new Date(user.verificationCodeExpire) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'member',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account successfully verified!',
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
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify account', details: error.message },
      { status: 500 }
    );
  }
}
