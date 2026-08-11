import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isUsuarioParceiroComercial } from '../utils/usuario-sessao.util';

export const ClienteGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isTokenValid()) {
    router.navigate(['/']);
    return false;
  }

  const usuario = authService.getUserFromStorage();
  if (!usuario) {
    router.navigate(['/']);
    return false;
  }

  const isParceiro = isUsuarioParceiroComercial(usuario);

  if (isParceiro) {
    console.log('[ClienteGuard] Parceiro comercial tentou acessar area de cliente. Redirecionando para /ofertas-parceiro.');
    router.navigate(['/ofertas-parceiro']);
    return false;
  }

  return true;
};