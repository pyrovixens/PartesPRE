# Recuperación del súper usuario

Cuenta principal: `gnunezgonzalez@icloud.com` (`usr-superadmin-01`).

## Activación

1. Configurar `SUPABASE_SERVICE_ROLE_KEY` como secreto **del servidor** en el despliegue. No usar el prefijo `NEXT_PUBLIC_`. La URL de Supabase debe estar configurada también.
2. Ejecutar una sola vez `supabase/migrations/20260929_password_change.sql` en Supabase. La migración añade el indicador de cambio obligatorio y protege la cuenta principal del acceso directo desde clientes públicos. No restablece ninguna clave. La política restrictiva protege también frente a políticas permisivas antiguas. Configurar y verificar primero el secreto del servidor para evitar interrumpir el acceso de la versión anterior.
3. Desplegar esta versión.
4. En un entorno privado con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` disponibles, ejecutar `npm run reset:super-admin`. El script verifica la identidad de la cuenta, genera una clave aleatoria, guarda únicamente su hash scrypt, elimina la contraseña en texto y limpia el bloqueo. Solo muestra la clave cuando la escritura termina con éxito. No ejecutarlo en CI ni en terminales con registros compartidos.
5. Entregar por privado la clave impresa. Al ingresar se abre el formulario obligatorio; la sesión se crea después de guardar la nueva clave. La clave temporal deja de funcionar. No repetir el script salvo que se desee otro restablecimiento.

## Validación

`npm run test:auth` cubre los dos formatos históricos, rechazo del hash como contraseña, bloqueo, formulario obligatorio, retiro de la clave temporal y fallo de persistencia. Usa sustitutos para el almacenamiento; la migración y el flujo completo deben verificarse también en una instancia de Supabase antes de producción.

## Alcance

El bloqueo obligatorio corresponde al flujo de inicio de sesión de esta aplicación. El proyecto ya utiliza sesiones de navegador en localStorage y varias API de datos no tienen autorización de sesión del servidor. Este cambio protege la cuenta principal frente a las escrituras genéricas de usuarios y su acceso directo desde Supabase; no sustituye una revisión integral de autorización de todas las API ni revoca sesiones antiguas en otros dispositivos.
