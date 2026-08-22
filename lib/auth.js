import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_vibecoding_learning_task_app';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from request cookies or Authorization header.
 * @param {Request} request
 * @returns {{ userId: string, email: string, name: string, role: string } | null}
 */
export function getAuthUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenFromCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('token='))
    ?.split('=')[1];

  const authHeader = request.headers.get('authorization') || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;
  if (!token) return null;

  return verifyToken(token);
}
