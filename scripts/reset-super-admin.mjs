import { randomBytes, scryptSync } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en un entorno privado del servidor.');
const db = createClient(url, key, { auth: { persistSession: false } });
const { data: user, error } = await db.from('app_users').select('id,email,role').eq('id', 'usr-superadmin-01').single();
if (error || user?.email?.toLowerCase() !== 'gnunezgonzalez@icloud.com' || user?.role !== 'SUPER_ADMIN') {
  throw new Error('No se encontró la cuenta principal esperada. No se modificó ninguna cuenta.');
}
const password = `G4!${randomBytes(18).toString('base64url')}`;
const salt = randomBytes(16).toString('hex');
const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
const { error: saveError } = await db.from('app_users').update({ password: null, password_hash: hash,
  must_change_password: true, failed_login_attempts: 0, locked_until: null, status: 'ACTIVO',
  updated_at: new Date().toISOString() }).eq('id', user.id);
if (saveError) throw new Error(`No se pudo guardar la clave temporal: ${saveError.message}`);
console.log(`Usuario: ${user.email}\nClave temporal (entregar por privado): ${password}`);
