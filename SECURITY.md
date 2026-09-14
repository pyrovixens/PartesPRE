# Seguridad

## Reporte de vulnerabilidades

No publiques datos personales, credenciales ni detalles explotables en un issue público.
Contacta de forma privada al mantenedor del repositorio.

## Configuración obligatoria

El servidor necesita:

- `SUPABASE_SERVICE_ROLE_KEY` únicamente en el entorno del servidor.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Supabase Auth.
- `APP_URL` con el origen HTTPS autorizado para invitaciones.
- `RESEND_API_KEY` y `EMAIL_FROM` si se enviarán invitaciones automáticamente.

Nunca expongas la service role con el prefijo `NEXT_PUBLIC_`.

## Despliegue de esta corrección

1. Haz respaldo de Supabase.
2. Ejecuta `supabase/migrations/20260914_security_hardening.sql`.
3. Comprueba que cada perfil operativo tenga `auth_user_id`.
4. Rota claves y contraseñas que hayan estado en el historial.
5. Despliega la aplicación y verifica el flujo de login, invitación y permisos.
6. Mantén el repositorio privado si contiene información operacional.

La migración revoca el acceso de `anon` y `authenticated` a las tablas. Toda lectura o
escritura pasa por las APIs protegidas del servidor.
