/** Chave antiga (global) — causava vazamento de foto entre contas no mesmo navegador. */
export const LEGACY_FOTO_PERFIL_KEY = 'fotoPerfil';

const PREFIX = 'fotoPerfil_';

export function fotoPerfilKeyForUser(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function readStoredFotoPerfil(userId: string | undefined | null): string | null {
  if (!userId) {
    return null;
  }
  return localStorage.getItem(fotoPerfilKeyForUser(String(userId)));
}

/** Persiste foto só para este usuário e remove a chave legada global. */
export function writeStoredFotoPerfil(userId: string, dataUrlOrPath: string): void {
  localStorage.setItem(fotoPerfilKeyForUser(String(userId)), dataUrlOrPath);
  localStorage.removeItem(LEGACY_FOTO_PERFIL_KEY);
}

export function clearStoredFotoPerfilForUser(userId: string | undefined | null): void {
  if (!userId) {
    return;
  }
  localStorage.removeItem(fotoPerfilKeyForUser(String(userId)));
  localStorage.removeItem(LEGACY_FOTO_PERFIL_KEY);
}

/** Logout / troca de sessão: remove legado e todas as fotos em cache por usuário. */
export function clearAllFotoPerfilLocalCache(): void {
  localStorage.removeItem(LEGACY_FOTO_PERFIL_KEY);
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}
