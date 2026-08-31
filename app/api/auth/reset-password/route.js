import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/auth/reset-password - Verify OTP and update password
export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15 min per IP

    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Please try again in ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    await dbConnect();
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, 6-digit code, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset request or user not found.' },
        { status: 400 }
      );
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Invalid 6-digit reset code.' },
        { status: 400 }
      );
    }

    if (user.resetPasswordExpire && new Date(user.resetPasswordExpire) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Password reset code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Hash and update password
    user.password = await hashPassword(newPassword);
    user.resetPasswordCode = null;
    user.resetPasswordExpire = null;
    // Auto-verify account if not already verified
    user.isVerified = true;
    await user.save();

    // Auto-login: generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'member',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated! You are now signed in.',
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
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password', details: error.message },
      { status: 500 }
    );
  }
}
