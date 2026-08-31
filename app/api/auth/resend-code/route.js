import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/auth/resend-code - Generate and resend fresh 6-digit OTP code
export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`resend:${ip}`, 3, 10 * 60 * 1000); // 3 resends per 10 min per IP

    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many resend attempts. Please wait ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
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
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: 'Account is already verified.',
      });
    }

    // Generate fresh code & 10-min expiration
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail({ to: user.email, name: user.name, code: verificationCode });

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification code', details: error.message },
      { status: 500 }
    );
  }
}
