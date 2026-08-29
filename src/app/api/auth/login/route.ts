import { NextRequest, NextResponse } from 'next/server';
import { serverGetUsers, serverSaveUser, serverSanitizeUser } from '../../../../lib/serverStore';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimiter';

export const dynamic = 'force-dynamic';

const PASSWORD_SALT = 'bomberos_calle_larga_4ta_sec_2026';

// Server-side SHA-256 with Salt
async function serverHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}${PASSWORD_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (Max 10 login attempts per minute per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login_${clientIp}`, 10, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Demasiados intentos de acceso desde tu red. Intenta nuevamente en ${rateCheck.resetSeconds} segundos.` 
        }, 
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa tu correo electrónico y contraseña.' },
        { status: 400 }
      );
    }

    // 2. Fetch authoritative users on server
    const allUsers = await serverGetUsers();
    const targetUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
        { status: 401 }
      );
    }

    // 3. Check account suspension
    if (targetUser.status === 'SUSPENDIDO') {
      return NextResponse.json(
        { success: false, error: 'Cuenta suspendida o no habilitada. Contacta al Mando Oficial.' },
        { status: 403 }
      );
    }

    // 4. Check Lockout Protocol
    if (targetUser.lockedUntil) {
      const lockTime = new Date(targetUser.lockedUntil).getTime();
      const now = Date.now();
      if (lockTime > now) {
        const minutesLeft = Math.ceil((lockTime - now) / (60 * 1000));
        return NextResponse.json(
          { 
            success: false, 
            error: `Acceso temporalmente bloqueado por seguridad. Intenta nuevamente en ${minutesLeft} minuto(s).` 
          },
          { status: 423 }
        );
      }
    }

    // 5. Password Hash Comparison
    const hashedAttempt = await serverHashPassword(cleanPassword);
    const passwordMatches = 
      targetUser.passwordHash === hashedAttempt ||
      (Boolean(targetUser.password) && targetUser.password === cleanPassword) ||
      targetUser.passwordHash === cleanPassword;

    if (!passwordMatches) {
      const failedAttempts = (targetUser.failedLoginAttempts || 0) + 1;
      const maxAttempts = 5;

      const updatedUser = {
        ...targetUser,
        failedLoginAttempts: failedAttempts,
        lockedUntil: failedAttempts >= maxAttempts 
          ? new Date(Date.now() + 15 * 60 * 1000).toISOString() 
          : undefined,
      };

      await serverSaveUser(updatedUser);

      if (failedAttempts >= maxAttempts) {
        return NextResponse.json(
          {
            success: false,
            error: 'Has superado el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos por seguridad.',
            remainingAttempts: 0,
          },
          { status: 423 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Contraseña incorrecta. Te quedan ${maxAttempts - failedAttempts} intento(s) antes del bloqueo.`,
          remainingAttempts: maxAttempts - failedAttempts,
        },
        { status: 401 }
      );
    }

    // 6. Login Success: Reset failed attempts & record last login
    const updatedUser = {
      ...targetUser,
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLogin: new Date().toISOString(),
    };

    await serverSaveUser(updatedUser);

    const safeUser = serverSanitizeUser(updatedUser);
    const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    return NextResponse.json({
      success: true,
      user: safeUser,
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error en el servidor de autenticación.' },
      { status: 500 }
    );
  }
}
