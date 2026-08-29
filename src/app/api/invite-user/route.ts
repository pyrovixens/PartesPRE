import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      fullName, 
      volunteerId, 
      rank, 
      registrationNumber, 
      role, 
      permissions, 
      invitedBy,
      token,
      origin 
    } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, message: 'El correo y el nombre son obligatorios.' },
        { status: 400 }
      );
    }

    const hostUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
    const activationUrl = `${hostUrl}/crear-cuenta?email=${encodeURIComponent(email)}`;

    // Email Subject
    const subject = `🚒 Invitación Oficial: Sistema de Partes - 4ª Cía. Bomberos Calle Larga`;

    // Email Plain Text Body (Discreet - does NOT expose internal system role)
    const textBody = `Estimado/a ${fullName} (${rank || 'Bombero'}),\n\n` +
      `Has recibido una invitación oficial de ${invitedBy || 'la Oficialidad'} para acceder al Sistema de Control de Asistencias y Partes de Emergencia de la 4ª Compañía "Calle Larga" (Cuerpo de Bomberos de Los Andes).\n\n` +
      `Para crear tu cuenta oficial y registrar tu contraseña personal de acceso, haz clic en el siguiente enlace:\n` +
      `${activationUrl}\n\n` +
      `Este enlace de registro es de uso personal y válido por 7 días.\n\n` +
      `4ª Compañía de Bomberos "Calle Larga"\n` +
      `"Honor, Disciplina y Abnegación" • C.B. Los Andes`;

    // Formatted mailto link
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;

    // Web Gmail Direct compose link
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;

    // Automated Resend dispatch if configured
    let directEmailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Bomberos Calle Larga <onboarding@resend.dev>',
            to: [email],
            subject: subject,
            text: textBody,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #8b0000; padding-bottom: 16px;">
                  <h2 style="color: #8b0000; margin: 0; font-size: 20px;">4ª COMPAÑÍA "BOMBA CALLE LARGA"</h2>
                  <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px; font-weight: bold;">Cuerpo de Bomberos de Los Andes</p>
                </div>
                <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #dc2626;">
                  <h3 style="color: #1e293b; margin-top: 0; font-size: 16px;">Invitación Oficial al Sistema de Partes</h3>
                  <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                    Estimado/a <strong>${fullName}</strong> (${rank || 'Bombero'}),
                  </p>
                  <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                    Has recibido una invitación oficial emitida por <strong>${invitedBy || 'la Oficialidad de Compañía'}</strong> para acceder al sistema institucional de control de asistencias y partes de emergencia.
                  </p>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${activationUrl}" style="background-color: #dc2626; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                    🔑 Crear Mi Contraseña y Acceder
                  </a>
                </div>
                <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
                  <a href="${activationUrl}" style="color: #dc2626; word-break: break-all;">${activationUrl}</a>
                </p>
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
                  Este enlace es de uso personal e intransferible. Válido por 7 días.<br/>
                  4ª Compañía "Bomba Calle Larga" • "Honor, Disciplina y Abnegación"
                </p>
              </div>
            `,
          }),
        });
        if (resendRes.ok) {
          directEmailSent = true;
        }
      } catch (err) {
        console.warn('Direct Resend email dispatch failed, fallback ready:', err);
      }
    }

    return NextResponse.json({
      success: true,
      directEmailSent,
      activationUrl,
      mailtoUrl,
      gmailUrl,
      subject,
      textBody,
      recipient: email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error al procesar invitación.' },
      { status: 500 }
    );
  }
}
