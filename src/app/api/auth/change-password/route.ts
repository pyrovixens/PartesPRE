import { NextRequest, NextResponse } from 'next/server';
import { serverGetUsers, serverSaveUser, serverRecordAuthAttempt } from '../../../../lib/serverStore';
import { hashServerPassword, isStrongPassword, verifyServerPassword } from '../../../../lib/passwords';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimiter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`login_${getClientIp(req)}`, 10, 60);
  if (!limit.allowed) return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const user = (await serverGetUsers()).find(u => u.email.toLowerCase() === email);
    if (!user || user.status !== 'ACTIVO' || !user.mustChangePassword
      || (user.lockedUntil && Date.parse(user.lockedUntil) > Date.now())) {
      return NextResponse.json({ error: 'No es posible cambiar la clave temporal. Inicia sesión nuevamente.' }, { status: 403 });
    }
    if (!verifyServerPassword(currentPassword, user.passwordHash, user.password)) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      await serverRecordAuthAttempt({ ...user, failedLoginAttempts: attempts,
        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : undefined });
      return NextResponse.json({ error: 'La clave temporal no es válida.' }, { status: 401 });
    }
    if (!isStrongPassword(newPassword) || newPassword === currentPassword) {
      return NextResponse.json({ error: 'Usa una clave distinta, de 12 a 128 caracteres, con mayúscula, minúscula, número y símbolo.' }, { status: 400 });
    }
    await serverSaveUser({ ...user, password: undefined, passwordHash: hashServerPassword(newPassword),
      mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: undefined }, true, user.passwordHash);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar la contraseña. Verifica la conexión y la migración de Supabase.' }, { status: 500 });
  }
}
