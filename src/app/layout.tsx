import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema de Partes de Emergencia | 4ª Cía Calle Larga',
  description: 'Control Integral de Partes de Emergencia, Asistencias, Dashboard y Reportes para el Cuerpo de Bomberos Los Andes - Cuarta Compañía Calle Larga',
  icons: {
    icon: '/logo_4ta_calle_larga.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100/70 antialiased selection:bg-red-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
