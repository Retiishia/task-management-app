import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/auth/forgot-password - Request 6-digit password reset OTP
export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000); // 3 requests per 15 min per IP

    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests. Please try again in ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Note: Return generic success for security (prevents user enumeration), but send email if user exists
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
      });
    }

    // Generate 6-digit reset code & 15-minute expiration
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      code,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
      email: user.email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request', details: error.message },
      { status: 500 }
    );
  }
}
