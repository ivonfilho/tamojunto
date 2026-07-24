import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ParceiroGuard: CanActivateFn = (route, state) => {
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

  // Apenas parceiro comercial deve validar/resgatar cupom.
  const isParceiro = usuario.role === 'Parceiro';

  if (!isParceiro) {
    console.log('[ParceiroGuard] Cliente tentando acessar validação de cupom, redirecionando...');
    router.navigate(['/dashboard'], {
      queryParams: {
        message: 'Somente parceiro comercial pode validar o cupom.'
      }
    });
    return false;
  }

  return true;
}; 