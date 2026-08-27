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

    const hostUrl = origin || 'http://localhost:3003';
    const activationUrl = `${hostUrl}/crear-cuenta?email=${encodeURIComponent(email)}`;

    const roleNameFormatted = 
      role === 'SUPER_ADMIN' ? 'Super Administrador (Mando General)' :
      role === 'ADMIN' ? 'Administrador (Oficial de Mando)' :
      role === 'OFICIAL' ? 'Oficial de Guardia / Servicio' :
      'Voluntario de Compañía';

    // Email Subject
    const subject = `🚒 Invitación Oficial: Sistema de Partes - 4ª Cía. Bomberos Calle Larga`;

    // Email Plain Text Body (for mailto / clients without HTML)
    const textBody = `Estimado/a ${fullName} (${rank}),\n\n` +
      `Has recibido una invitación oficial de ${invitedBy || 'la Oficialidad'} para acceder al Sistema de Control de Asistencias y Partes de Emergencia de la 4ª Compañía "Calle Larga" (Cuerpo de Bomberos de Los Andes).\n\n` +
      `Tu rol asignado es: ${roleNameFormatted}\n\n` +
      `Para crear tu cuenta oficial y registrar tu contraseña personal de acceso, haz clic en el siguiente enlace:\n` +
      `${activationUrl}\n\n` +
      `Este enlace de registro es de uso personal y válido por 7 días.\n\n` +
      `4ª Compañía de Bomberos "Calle Larga"\n` +
      `"Unión, Lealtad y Servicio" • C.B. Los Andes`;

    // Formatted mailto link
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;

    // Web Gmail Direct compose link
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;

    return NextResponse.json({
      success: true,
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
