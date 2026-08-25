# 🚀 Guía de Despliegue en Supabase, GitHub y Vercel
### Sistema de Partes de Emergencia y Asistencias
**4ª Compañía de Bomberos "Calle Larga" – Cuerpo de Bomberos Los Andes**

---

## 📑 Paso 1: Configurar la Base de Datos en Supabase (Gratis)

1. Ingresa a [https://supabase.com](https://supabase.com) e inicia sesión (o regístrate gratis con GitHub/Email).
2. Haz clic en **"New Project"**.
   - **Name**: `Bomberos-4ta-Calle-Larga`
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: `South America (São Paulo)` para menor latencia en Chile.
3. Una vez creado el proyecto, ve al menú lateral izquierdo y haz clic en **"SQL Editor"** (`</>`).
4. Haz clic en **"New query"**, copia todo el contenido del archivo [`supabase/schema.sql`](file:///Users/macbook/Desktop/Partes%20de%20emergencia/supabase/schema.sql) y pégalo en el editor.
5. Haz clic en **"Run"** (botón verde abajo a la derecha).
   - *¡Listo! Se crearán todas las tablas, las políticas de seguridad, el padrón oficial de 31 bomberos y la sincronización en tiempo real.*
6. Ve a **Project Settings** (icono de engranaje ⚙️) -> **API**.
   - Copia la **Project URL** (ej. `https://xyzcompany.supabase.co`).
   - Copia la **anon public key** (ej. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`).

---

## 🐙 Paso 2: Subir el Proyecto a GitHub

Abre tu terminal en la carpeta del proyecto y ejecuta los siguientes comandos:

```bash
# 1. Inicializar repositorio git (si no está inicializado)
git init

# 2. Agregar todos los archivos
git add .

# 3. Hacer el primer commit oficial
git commit -m "feat: Sistema de partes 4ta Cia Calle Larga con soporte Supabase y Vercel"

# 4. Crear el repositorio en GitHub (desde https://github.com/new)
# Luego vincularlo con tu cuenta:
git remote add origin https://github.com/TU-USUARIO/partes-emergencia-4ta-calle-larga.git
git branch -M main
git push -u origin main
```

---

## ⚡ Paso 3: Desplegar en Vercel (1 Clic)

1. Ingresa a [https://vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio `partes-emergencia-4ta-calle-larga` y haz clic en **"Import"**.
4. En la sección **"Environment Variables"**, añade las 2 variables que copiaste de Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `tu-anon-public-key`
5. Haz clic en **"Deploy"**.

En menos de 60 segundos tendrás tu enlace público oficial con certificado SSL HTTPS (ej. `https://partes-4ta-callelarga.vercel.app`) listo para ser usado por cualquier voluntario u oficial desde su celular, tablet o computadora en cualquier lugar del mundo.

---

## 📡 Sincronización en Tiempo Real (Realtime)

Gracias a `Supabase Realtime`:
- Cuando el **Oficial de Guardia** emita o apruebe un parte en el cuartel, se actualizará en las pantallas de todos los voluntarios en tiempo real.
- Cualquier modificación a la flota (`B-4`, `BX-4`, `R-4`, `K-4`) u odómetro se reflejará al instante.
- Si no hay conexión a internet momentáneamente, el sistema guarda todo en el almacenamiento local y continúa operando sin interrupciones.
