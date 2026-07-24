import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode } from 'jwt-decode';
import { clearAllFotoPerfilLocalCache } from '../utils/foto-perfil-storage.util';
import { roleFromJwtPayload } from '../utils/usuario-sessao.util';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private cookieService: CookieService) {}

  setToken(authObject: any): void {
    const decodedToken: any = jwtDecode(authObject);
    const accessTokenExpirationDate = this.transformExpToDate(decodedToken.exp);

    this.cookieService.set('tamo_junto_token', authObject, {
      expires: accessTokenExpirationDate,
      path: '/',
    });
  }

  getToken(): string | null {
    return this.cookieService.get('tamo_junto_token');
  }

  clearToken(): void {
    clearAllFotoPerfilLocalCache();
    localStorage.removeItem('tamo_junto_user');
    localStorage.removeItem('usuarioLogado');
    this.cookieService.delete('tamo_junto_token', '/');
  }

  isTokenValid(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    const decodedToken: any = jwtDecode(token);
    const expiresAt = this.transformExpToDate(decodedToken.exp);

    return expiresAt > new Date();
  }

  // Novo método para obter dados do usuário do token
  getUserFromToken(): any {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      return {
        ...decodedToken,
        Id: decodedToken?.Id ?? decodedToken?.id,
        role: roleFromJwtPayload(decodedToken),
      };
    } catch (error) {
      console.error('[AuthService] Erro ao decodificar token:', error);
      return null;
    }
  }

  transformExpToDate(exp: number) {
    return new Date(exp * 1000);
  }

  getUserFromStorage(): any {
    var usuario = localStorage.getItem('tamo_junto_user');
    if (usuario) return JSON.parse(usuario);
    else return null;
  }
}
