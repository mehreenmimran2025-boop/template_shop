import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory rate limiter: ip → { attempts, lockedUntil }
const attempts = new Map<string, { count: number; lockedUntil: number; windowStart: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes after 5 failures

function getIp(req: Request): string {
  const hdrs = headers();
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry) {
    if (entry.lockedUntil > now) {
      return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    if (now - entry.windowStart > WINDOW_MS) {
      attempts.delete(ip);
    }
  }
  return { allowed: true };
}

function recordFailure(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip) ?? { count: 0, lockedUntil: 0, windowStart: now };
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
    entry.lockedUntil = 0;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
  attempts.set(ip, entry);
}

function clearFailures(ip: string) {
  attempts.delete(ip);
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const { allowed, retryAfterSec } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${Math.ceil(retryAfterSec! / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid || user.role !== 'ADMIN') {
    recordFailure(ip);
    // Generic message — don't reveal whether email or password was wrong, or whether the account exists
    return NextResponse.json({ error: 'Incorrect details.' }, { status: 401 });
  }

  if (user.blocked) {
    return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
  }

  clearFailures(ip);

  await setSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: 'ADMIN',
  });

  return NextResponse.json({ ok: true });
}
