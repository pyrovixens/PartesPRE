import { supabase } from './supabase';

export const apiFetch = async (
  input: string,
  init: RequestInit = {},
  requireAuthentication = true
): Promise<Response> => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireAuthentication) {
    if (!supabase) {
      throw new Error('Supabase Auth no está configurado.');
    }

    const { data, error } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (error || !accessToken) {
      throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    }

    headers.set('Authorization', 'Bearer ' + accessToken);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: init.cache || 'no-store',
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('partes_auth_profile_v2');
  }

  return response;
};

export const readApiResult = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || payload.message || 'La operación no pudo completarse.');
  }
  return payload.data as T;
};
