import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isUsuarioParceiroComercial } from '../utils/usuario-sessao.util';

export const DashboardGuard: CanActivateFn = (route, state) => {
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

  const rotaAtual = state.url;
  const isParceiro = isUsuarioParceiroComercial(usuario);

  // Se é parceiro tentando acessar dashboard de cliente
  if (isParceiro && rotaAtual.includes('/dashboard') && !rotaAtual.includes('dashboard-parceiro')) {
    console.log('[DashboardGuard] Parceiro tentando acessar dashboard de cliente, redirecionando...');
    router.navigate(['/dashboard-parceiro']);
    return false;
  }

  // Se é cliente tentando acessar dashboard de parceiro
  if (!isParceiro && rotaAtual.includes('dashboard-parceiro')) {
    console.log('[DashboardGuard] Cliente tentando acessar dashboard de parceiro, redirecionando...');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
}; 