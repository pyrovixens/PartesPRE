/**
 * Utilidades de búsqueda rápida e insensible a mayúsculas, minúsculas y tildes/acentos.
 * Permite que búsquedas como "nunez", "Núñez", "NUNEZ", "gonzalez", "capitan", etc. coincidan de inmediato.
 */

export const normalizeText = (text: string = ''): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const matchNormalized = (target: string = '', query: string = ''): boolean => {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return true;
  if (!target) return false;
  return normalizeText(target).includes(cleanQuery);
};

export const searchInFields = (fields: (string | undefined | null)[], query: string = ''): boolean => {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return true;
  return fields.some(f => f ? normalizeText(f).includes(cleanQuery) : false);
};
