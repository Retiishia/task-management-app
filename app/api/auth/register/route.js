import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5 registrations per hour per IP

    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please try again in ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
        },
        { status: 429 }
      );
    }

    await dbConnect();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (!existingUser.isVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.verificationCode = code;
        existingUser.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
        await existingUser.save();

        await sendVerificationEmail({ to: existingUser.email, name: existingUser.name, code });

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          email: existingUser.email,
          message: 'An unverified account exists. A new 6-digit verification code has been sent.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Assign 'admin' role ONLY to the email defined in ADMIN_EMAIL env variable
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const role = adminEmail && email.toLowerCase() === adminEmail ? 'admin' : 'member';

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isVerified: false,
      verificationCode,
      verificationCodeExpire,
    });

    await sendVerificationEmail({ to: user.email, name: user.name, code: verificationCode });

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register account', details: error.message },
      { status: 500 }
    );
  }
}
